"""
Q-Learn Nexus - Google Cirq Provider Adapter
Executes circuits via real Google Cirq runtime when installed.
"""

import time
from typing import Dict, Any, Optional
from app.schemas.models import QuantumCircuitIR, NormalizedResult
from app.result_normalizer import normalize_simulation_result

try:
    import cirq
    CIRQ_AVAILABLE = True
except ImportError:
    CIRQ_AVAILABLE = False


def is_available() -> bool:
    return CIRQ_AVAILABLE


def get_version_info() -> Dict[str, str]:
    if not CIRQ_AVAILABLE:
        return {"status": "NOT CONFIGURED", "error": "cirq not installed"}
    return {
        "status": "READY",
        "cirq_version": getattr(cirq, "__version__", "unknown"),
        "backend": "cirq.Simulator"
    }


def run_cirq(circuit: QuantumCircuitIR, shots: int = 1024) -> NormalizedResult:
    if not CIRQ_AVAILABLE:
        raise RuntimeError("Google Cirq runtime is NOT CONFIGURED on this worker node.")

    start_time = time.perf_counter()
    qubits = [cirq.LineQubit(i) for i in range(circuit.qubits)]
    c_circuit = cirq.Circuit()

    for gate in circuit.gates:
        gtype = gate.type
        t = qubits[gate.targets[0]]
        if gtype == "H":
            c_circuit.append(cirq.H(t))
        elif gtype == "X":
            c_circuit.append(cirq.X(t))
        elif gtype == "Y":
            c_circuit.append(cirq.Y(t))
        elif gtype == "Z":
            c_circuit.append(cirq.Z(t))
        elif gtype == "S":
            c_circuit.append(cirq.S(t))
        elif gtype == "T":
            c_circuit.append(cirq.T(t))
        elif gtype == "Rx":
            c_circuit.append(cirq.rx(gate.params.theta or 0)(t))
        elif gtype == "Ry":
            c_circuit.append(cirq.ry(gate.params.theta or 0)(t))
        elif gtype == "Rz":
            c_circuit.append(cirq.rz(gate.params.phi or 0)(t))
        elif gtype == "CX":
            c_circuit.append(cirq.CNOT(qubits[gate.controls[0]], t))
        elif gtype == "CZ":
            c_circuit.append(cirq.CZ(qubits[gate.controls[0]], t))
        elif gtype == "SWAP":
            c_circuit.append(cirq.SWAP(qubits[gate.targets[0]], qubits[gate.targets[1]]))
        elif gtype == "CCX":
            c_circuit.append(cirq.TOFFOLI(qubits[gate.controls[0]], qubits[gate.controls[1]], t))

    # Add measurement for sampling
    c_circuit.append(cirq.measure(*qubits, key='result'))

    sim = cirq.Simulator()
    sim_result = sim.run(c_circuit, repetitions=shots)
    raw_hist = sim_result.histogram(key='result')

    dim = 1 << circuit.qubits
    counts = {}
    probabilities = {}
    for state_int, count in raw_hist.items():
        bitstr = bin(state_int)[2:].zfill(circuit.qubits)
        counts[bitstr] = int(count)
        probabilities[bitstr] = float(count / shots)

    duration_ms = (time.perf_counter() - start_time) * 1000.0

    return normalize_simulation_result(
        provider="cirq",
        backend="cirq.Simulator",
        qubits=circuit.qubits,
        shots=shots,
        counts=counts,
        probabilities=probabilities,
        statevector=None,
        execution_time_ms=duration_ms,
        metadata={"cirq_version": cirq.__version__}
    )
