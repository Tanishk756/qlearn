"""
Q-Learn Nexus - PennyLane Provider Adapter
Executes circuits via real Xanadu PennyLane runtime when installed.
"""

import time
from typing import Dict, Any, Optional
from app.schemas.models import QuantumCircuitIR, NormalizedResult
from app.result_normalizer import normalize_simulation_result

try:
    import pennylane as qml
    import numpy as np
    PENNYLANE_AVAILABLE = True
except ImportError:
    PENNYLANE_AVAILABLE = False


def is_available() -> bool:
    return PENNYLANE_AVAILABLE


def get_version_info() -> Dict[str, str]:
    if not PENNYLANE_AVAILABLE:
        return {"status": "NOT CONFIGURED", "error": "pennylane not installed"}
    return {
        "status": "READY",
        "pennylane_version": getattr(qml, "__version__", "unknown"),
        "backend": "default.qubit"
    }


def run_pennylane(circuit: QuantumCircuitIR, shots: int = 1024) -> NormalizedResult:
    if not PENNYLANE_AVAILABLE:
        raise RuntimeError("PennyLane runtime is NOT CONFIGURED on this worker node.")

    start_time = time.perf_counter()
    dev = qml.device("default.qubit", wires=circuit.qubits, shots=shots)

    @qml.qnode(dev)
    def qnode_circuit():
        for gate in circuit.gates:
            gtype = gate.type
            t = gate.targets[0]
            if gtype == "H":
                qml.Hadamard(wires=t)
            elif gtype == "X":
                qml.PauliX(wires=t)
            elif gtype == "Y":
                qml.PauliY(wires=t)
            elif gtype == "Z":
                qml.PauliZ(wires=t)
            elif gtype == "S":
                qml.S(wires=t)
            elif gtype == "T":
                qml.T(wires=t)
            elif gtype == "Rx":
                qml.RX(gate.params.theta or 0, wires=t)
            elif gtype == "Ry":
                qml.RY(gate.params.theta or 0, wires=t)
            elif gtype == "Rz":
                qml.RZ(gate.params.phi or 0, wires=t)
            elif gtype == "CX":
                qml.CNOT(wires=[gate.controls[0], t])
            elif gtype == "CZ":
                qml.CZ(wires=[gate.controls[0], t])
            elif gtype == "SWAP":
                qml.SWAP(wires=[gate.targets[0], gate.targets[1]])
            elif gtype == "CCX":
                qml.Toffoli(wires=[gate.controls[0], gate.controls[1], t])

        return qml.probs(wires=range(circuit.qubits)), qml.counts()

    probs, raw_counts = qnode_circuit()
    
    # Format counts and probabilities
    formatted_counts = {str(k): int(v) for k, v in raw_counts.items()}
    formatted_probs = {}
    dim = 1 << circuit.qubits
    for i, p in enumerate(probs):
        bitstr = bin(i)[2:].zfill(circuit.qubits)
        formatted_probs[bitstr] = float(p)

    duration_ms = (time.perf_counter() - start_time) * 1000.0

    return normalize_simulation_result(
        provider="pennylane",
        backend="default.qubit",
        qubits=circuit.qubits,
        shots=shots,
        counts=formatted_counts,
        probabilities=formatted_probs,
        statevector=None,
        execution_time_ms=duration_ms,
        metadata={"pennylane_version": qml.__version__}
    )
