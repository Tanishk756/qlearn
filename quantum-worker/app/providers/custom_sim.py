"""
Q-Learn Nexus - Pure Python Quantum Statevector Simulator
Deterministic statevector evolution, gate matrix applications, and Born rule shot sampling.
"""

import time
import math
import random
from typing import List, Dict, Tuple, Optional
from app.schemas.models import QuantumCircuitIR, NormalizedResult
from app.result_normalizer import normalize_simulation_result

# Canonical Unitary Matrices
SQRT1_2 = 1.0 / math.sqrt(2)

GATES_1Q = {
    "X": [[0, 1], [1, 0]],
    "Y": [[0, -1j], [1j, 0]],
    "Z": [[1, 0], [0, -1]],
    "H": [[SQRT1_2, SQRT1_2], [SQRT1_2, -SQRT1_2]],
    "S": [[1, 0], [0, 1j]],
    "Sdg": [[1, 0], [0, -1j]],
    "T": [[1, 0], [0, complex(SQRT1_2, SQRT1_2)]],
    "Tdg": [[1, 0], [0, complex(SQRT1_2, -SQRT1_2)]],
}

def get_rotation_matrix(gate_type: str, theta: float) -> List[List[complex]]:
    half = theta / 2.0
    c = math.cos(half)
    s = math.sin(half)
    if gate_type == "Rx":
        return [[complex(c, 0), complex(0, -s)], [complex(0, -s), complex(c, 0)]]
    elif gate_type == "Ry":
        return [[complex(c, 0), complex(-s, 0)], [complex(s, 0), complex(c, 0)]]
    elif gate_type == "Rz":
        return [[complex(c, -s), 0], [0, complex(c, s)]]
    return [[1, 0], [0, 1]]


def run_custom_simulation(circuit: QuantumCircuitIR, shots: int = 1024) -> NormalizedResult:
    start_time = time.perf_counter()
    n = circuit.qubits
    dim = 1 << n

    # Initialize |0...0> statevector
    state = [0j] * dim
    state[0] = 1.0 + 0j

    # Sort gates by step index
    sorted_gates = sorted(circuit.gates, key=lambda g: g.stepIndex)

    for gate in sorted_gates:
        gtype = gate.type
        targets = gate.targets
        controls = gate.controls or []

        if gtype in GATES_1Q or gtype in ("Rx", "Ry", "Rz"):
            t = targets[0]
            if gtype in ("Rx", "Ry", "Rz"):
                theta = gate.params.theta if gate.params and gate.params.theta is not None else 0.0
                mat = get_rotation_matrix(gtype, theta)
            else:
                mat = GATES_1Q[gtype]

            # Apply 1-qubit gate (Little-Endian: bit t is at (1 << t))
            step = 1 << t
            new_state = list(state)
            for i in range(0, dim, 2 * step):
                for j in range(step):
                    idx0 = i + j
                    idx1 = idx0 + step
                    a0 = state[idx0]
                    a1 = state[idx1]
                    new_state[idx0] = mat[0][0] * a0 + mat[0][1] * a1
                    new_state[idx1] = mat[1][0] * a0 + mat[1][1] * a1
            state = new_state

        elif gtype == "CX":
            c = controls[0]
            t = targets[0]
            c_mask = 1 << c
            t_mask = 1 << t
            new_state = list(state)
            for i in range(dim):
                if (i & c_mask) != 0 and (i & t_mask) == 0:
                    j = i | t_mask
                    new_state[i] = state[j]
                    new_state[j] = state[i]
            state = new_state

        elif gtype == "CZ":
            c = controls[0]
            t = targets[0]
            c_mask = 1 << c
            t_mask = 1 << t
            new_state = list(state)
            for i in range(dim):
                if (i & c_mask) != 0 and (i & t_mask) != 0:
                    new_state[i] = -state[i]
            state = new_state

        elif gtype == "SWAP":
            t0, t1 = targets[0], targets[1]
            m0 = 1 << t0
            m1 = 1 << t1
            new_state = list(state)
            for i in range(dim):
                b0 = (i & m0) >> t0
                b1 = (i & m1) >> t1
                if b0 != b1 and b0 == 0:
                    j = (i | m0) & (~m1)
                    new_state[i] = state[j]
                    new_state[j] = state[i]
            state = new_state

        elif gtype == "CCX":
            c0, c1 = controls[0], controls[1]
            t = targets[0]
            mask_c = (1 << c0) | (1 << c1)
            mask_t = 1 << t
            new_state = list(state)
            for i in range(dim):
                if (i & mask_c) == mask_c and (i & mask_t) == 0:
                    j = i | mask_t
                    new_state[i] = state[j]
                    new_state[j] = state[i]
            state = new_state

    # Compute probabilities & format bitstrings (Little-Endian format: q0 is rightmost)
    probabilities = {}
    cdf = []
    cumulative = 0.0

    for i in range(dim):
        prob = state[i].real**2 + state[i].imag**2
        bitstr = bin(i)[2:].zfill(n)
        probabilities[bitstr] = prob
        cumulative += prob
        cdf.append((cumulative, bitstr))

    # Measurement sampling
    counts = {b: 0 for b in probabilities.keys() if probabilities[b] > 1e-7}
    for _ in range(shots):
        r = random.random()
        for cum, b in cdf:
            if r <= cum:
                counts[b] = counts.get(b, 0) + 1
                break

    duration_ms = (time.perf_counter() - start_time) * 1000.0

    return normalize_simulation_result(
        provider="custom_sim",
        backend="statevector",
        qubits=n,
        shots=shots,
        counts=counts,
        probabilities=probabilities,
        statevector=state,
        execution_time_ms=duration_ms,
        metadata={"engine": "Q-Learn Pure Python Quantum Engine", "endianness": "little-endian"}
    )
