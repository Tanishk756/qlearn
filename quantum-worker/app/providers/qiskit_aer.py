"""
Q-Learn Nexus - Qiskit Aer Provider Adapter
Executes circuits via real Qiskit 1.x and Qiskit Aer runtime when installed.
"""

import time
from typing import Dict, Any, Optional
from app.schemas.models import QuantumCircuitIR, NormalizedResult
from app.result_normalizer import normalize_simulation_result

try:
    import qiskit
    from qiskit import QuantumCircuit
    import qiskit_aer
    from qiskit_aer import AerSimulator
    QISKIT_AVAILABLE = True
except ImportError:
    QISKIT_AVAILABLE = False


def is_available() -> bool:
    return QISKIT_AVAILABLE


def get_version_info() -> Dict[str, str]:
    if not QISKIT_AVAILABLE:
        return {"status": "NOT CONFIGURED", "error": "qiskit or qiskit_aer not installed"}
    return {
        "status": "READY",
        "qiskit_version": getattr(qiskit, "__version__", "unknown"),
        "qiskit_aer_version": getattr(qiskit_aer, "__version__", "unknown"),
        "backend": "AerSimulator"
    }


def run_qiskit_aer(circuit: QuantumCircuitIR, shots: int = 1024, noise_model: Optional[Dict[str, Any]] = None) -> NormalizedResult:
    if not QISKIT_AVAILABLE:
        raise RuntimeError("Qiskit Aer runtime is NOT CONFIGURED on this worker node.")

    start_time = time.perf_counter()
    qc = QuantumCircuit(circuit.qubits, circuit.classicalBits)

    for gate in circuit.gates:
        gtype = gate.type
        t = gate.targets[0]
        if gtype == "H":
            qc.h(t)
        elif gtype == "X":
            qc.x(t)
        elif gtype == "Y":
            qc.y(t)
        elif gtype == "Z":
            qc.z(t)
        elif gtype == "S":
            qc.s(t)
        elif gtype == "T":
            qc.t(t)
        elif gtype == "Rx":
            qc.rx(gate.params.theta or 0, t)
        elif gtype == "Ry":
            qc.ry(gate.params.theta or 0, t)
        elif gtype == "Rz":
            qc.rz(gate.params.phi or 0, t)
        elif gtype == "CX":
            qc.cx(gate.controls[0], t)
        elif gtype == "CZ":
            qc.cz(gate.controls[0], t)
        elif gtype == "SWAP":
            qc.swap(gate.targets[0], gate.targets[1])
        elif gtype == "CCX":
            qc.ccx(gate.controls[0], gate.controls[1], t)
        elif gtype == "Measure":
            qc.measure(t, t)

    # Save statevector before measurement
    qc.save_statevector()
    qc.measure_all()

    backend = AerSimulator()
    job = backend.run(qc, shots=shots)
    result = job.result()
    counts = result.get_counts(qc)
    sv = result.get_statevector(qc)

    total_counts = sum(counts.values())
    probabilities = {k: v / total_counts for k, v in counts.items()}
    duration_ms = (time.perf_counter() - start_time) * 1000.0

    return normalize_simulation_result(
        provider="qiskit_aer",
        backend="AerSimulator",
        qubits=circuit.qubits,
        shots=shots,
        counts=counts,
        probabilities=probabilities,
        statevector=list(sv.data) if hasattr(sv, 'data') else None,
        execution_time_ms=duration_ms,
        metadata={
            "qiskit_version": qiskit.__version__,
            "qiskit_aer_version": qiskit_aer.__version__
        }
    )
