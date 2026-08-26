"""
Q-Learn Nexus - Quantum Worker Microservice Entrypoint
Supports FastAPI when installed, with HTTP stdlib fallback for zero-dependency execution.
"""

import json
from app.schemas.models import HAS_PYDANTIC
from app.executor import execute_simulation, get_all_provider_statuses
from app.validators.security import validate_python_code

try:
    from fastapi import FastAPI, HTTPException, status
    from app.schemas.models import SimulationRequest, CodeExecutionRequest, NormalizedResult

    app = FastAPI(
        title="Q-Learn Nexus Quantum Worker",
        version="1.0.0",
        docs_url=None,
        redoc_url=None
    )

    @app.get("/health")
    def health_check():
        return {"status": "ok", "service": "quantum-worker"}

    @app.get("/providers")
    def list_providers():
        return get_all_provider_statuses()

    @app.post("/simulate", response_model=NormalizedResult)
    def simulate_circuit(req: SimulationRequest):
        try:
            return execute_simulation(req)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    @app.post("/validate-code")
    def validate_code(req: CodeExecutionRequest):
        safe, reason = validate_python_code(req.code)
        return {"safe": safe, "reason": reason}

except ImportError:
    # Standard library CLI / script mode
    app = None

    def handle_cli_execution(json_payload_str: str) -> str:
        try:
            data = json.loads(json_payload_str)
            action = data.get("action", "simulate")
            if action == "providers":
                return json.dumps(get_all_provider_statuses())
            elif action == "validate":
                code = data.get("code", "")
                safe, reason = validate_python_code(code)
                return json.dumps({"safe": safe, "reason": reason})
            elif action == "simulate":
                # Convert to models and execute
                from app.schemas.models import QuantumCircuitIR, CircuitGate, GateParams, SimulationRequest
                raw_ir = data.get("circuitIR", {})
                gates = []
                for g in raw_ir.get("gates", []):
                    params = None
                    if "params" in g and g["params"]:
                        p = g["params"]
                        params = GateParams(theta=p.get("theta"), phi=p.get("phi"), lambda_=p.get("lambda"))
                    gates.append(CircuitGate(
                        id=g.get("id", "g"),
                        type=g.get("type", "H"),
                        targets=g.get("targets", [0]),
                        controls=g.get("controls"),
                        stepIndex=g.get("stepIndex", 0),
                        params=params
                    ))
                ir = QuantumCircuitIR(
                    qubits=raw_ir.get("qubits", 1),
                    classicalBits=raw_ir.get("classicalBits", 1),
                    gates=gates,
                    version=raw_ir.get("version", "1.0"),
                    name=raw_ir.get("name", "Circuit")
                )
                req = SimulationRequest(
                    circuitIR=ir,
                    provider=data.get("provider", "custom"),
                    shots=data.get("shots", 1024)
                )
                res = execute_simulation(req)
                return json.dumps(res.__dict__, default=lambda o: o.__dict__)
            else:
                return json.dumps({"error": f"Unknown action: {action}"})
        except Exception as err:
            return json.dumps({"error": str(err)})

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        print(handle_cli_execution(sys.argv[1]))
