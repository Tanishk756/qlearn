"""
Q-Learn Nexus - Quantum Worker Execution Router
Routes incoming circuit requests to approved quantum providers with diagnostics.
"""

from typing import Dict, Any
from app.schemas.models import SimulationRequest, NormalizedResult
from app.providers import custom_sim, qiskit_aer, pennylane, cirq

def get_all_provider_statuses() -> Dict[str, Any]:
    return {
        "custom_sim": {"status": "READY", "backend": "Python Statevector", "type": "LOCAL_SIMULATOR"},
        "qiskit_aer": qiskit_aer.get_version_info(),
        "pennylane": pennylane.get_version_info(),
        "cirq": cirq.get_version_info(),
        "ibm_quantum": {"status": "NOT CONFIGURED", "error": "IBM Quantum API token not configured", "type": "HARDWARE"},
        "aws_braket": {"status": "NOT CONFIGURED", "error": "AWS Braket credentials not configured", "type": "HARDWARE"},
        "azure_quantum": {"status": "NOT CONFIGURED", "error": "Azure Quantum workspace not configured", "type": "HARDWARE"}
    }


def execute_simulation(request: SimulationRequest) -> NormalizedResult:
    provider = request.provider.lower()
    shots = request.shots
    circuit = request.circuitIR

    if not circuit:
        raise ValueError("circuitIR is required for simulation execution.")

    if provider in ("custom", "custom_sim", "nexus_sim"):
        return custom_sim.run_custom_simulation(circuit, shots)
    elif provider in ("qiskit", "qiskit_aer"):
        return qiskit_aer.run_qiskit_aer(circuit, shots, request.noiseModel)
    elif provider in ("pennylane", "pennylane_default"):
        return pennylane.run_pennylane(circuit, shots)
    elif provider in ("cirq", "google_cirq"):
        return cirq.run_cirq(circuit, shots)
    else:
        raise ValueError(f"Unknown or unconfigured quantum provider: {request.provider}")
