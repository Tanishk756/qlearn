"""
Q-Learn Nexus - Result Normalizer
Converts raw simulation engine outputs to standard NormalizedResult schema.
Enforces Canonical Little-Endian Qubit Ordering across all providers.
"""

import math
from typing import Dict, List, Any, Optional
from app.schemas.models import NormalizedResult, BlochVector

def compute_bloch_from_density_matrix(rho: List[List[complex]], qubit_idx: int) -> BlochVector:
    """
    Computes Bloch coordinates (x, y, z, theta, phi) from a 2x2 single-qubit reduced density matrix.
    """
    rho00 = rho[0][0].real
    rho11 = rho[1][1].real
    rho01 = rho[0][1]

    x = float(2.0 * rho01.real)
    y = float(-2.0 * rho01.imag)
    z = float(rho00 - rho11)

    # Spherical coordinates
    r = math.sqrt(x*x + y*y + z*z)
    if r < 1e-7:
        theta = 0.0
        phi = 0.0
    else:
        theta = math.acos(max(-1.0, min(1.0, z / r)))
        phi = math.atan2(y, x)
        if phi < 0:
            phi += 2 * math.pi

    p0 = max(0.0, min(1.0, float(rho00)))
    p1 = max(0.0, min(1.0, float(rho11)))

    return BlochVector(
        qubit=qubit_idx,
        x=round(x, 6),
        y=round(y, 6),
        z=round(z, 6),
        theta=round(theta, 6),
        phi=round(phi, 6),
        p0=round(p0, 6),
        p1=round(p1, 6)
    )


def normalize_simulation_result(
    provider: str,
    backend: str,
    qubits: int,
    shots: int,
    counts: Dict[str, int],
    probabilities: Dict[str, float],
    statevector: Optional[List[complex]] = None,
    execution_time_ms: float = 0.0,
    metadata: Optional[Dict[str, Any]] = None
) -> NormalizedResult:
    """
    Constructs a NormalizedResult and derives Bloch sphere coordinates where statevector is provided.
    """
    sv_dicts = None
    bloch_vectors = None

    if statevector is not None:
        sv_dicts = [{"re": round(c.real, 6), "im": round(c.imag, 6)} for c in statevector]

        # Compute single-qubit reduced density matrices & Bloch vectors
        dim = 1 << qubits
        bloch_vectors = []
        for q in range(qubits):
            # Compute 2x2 reduced density matrix for qubit q
            rho00 = 0.0
            rho11 = 0.0
            rho01_re = 0.0
            rho01_im = 0.0

            for i in range(dim):
                # Check bit q in index i (using Little-Endian: bit q is (i >> q) & 1)
                bit = (i >> q) & 1
                amp_i = statevector[i]
                prob = amp_i.real**2 + amp_i.imag**2

                if bit == 0:
                    rho00 += prob
                    # Find matching partner index with bit q flipped to 1
                    j = i | (1 << q)
                    amp_j = statevector[j]
                    # rho01 = amp_0 * conj(amp_1)
                    rho01_re += amp_i.real * amp_j.real + amp_i.imag * amp_j.imag
                    rho01_im += amp_i.imag * amp_j.real - amp_i.real * amp_j.imag
                else:
                    rho11 += prob

            rho_2x2 = [
                [complex(rho00, 0.0), complex(rho01_re, rho01_im)],
                [complex(rho01_re, -rho01_im), complex(rho11, 0.0)]
            ]
            bloch_vectors.append(compute_bloch_from_density_matrix(rho_2x2, q))

    return NormalizedResult(
        success=True,
        provider=provider,
        backend=backend,
        qubits=qubits,
        shots=shots,
        counts=counts,
        probabilities={k: round(v, 6) for k, v in probabilities.items()},
        statevector=sv_dicts,
        blochVectors=bloch_vectors,
        executionTimeMs=round(execution_time_ms, 2),
        metadata=metadata or {}
    )
