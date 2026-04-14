// ─────────────────────────────────────────────────────────────────
// Compute all body positions from system config
// ─────────────────────────────────────────────────────────────────

const computePositions = (
  systemConfig: any,
  simDay: number,
): Record<string, { x: number; y: number }> => {
  const positions: Record<string, { x: number; y: number }> = {};
  const bodyMap: Record<string, any> = {};

  for (const body of systemConfig.bodies ?? []) {
    bodyMap[body.id] = body;
  }

  // Add synthetic star entries if not in bodies array
  if (!bodyMap["taunor_prime"]) {
    positions["taunor_prime"] = { x: 0, y: 0 };
  }
  if (!bodyMap["taunor_minor"] && systemConfig.stars?.taunorMinor) {
    const s = systemConfig.stars.taunorMinor;
    const p = {
      orbitalRadius: s.orbitalRadius,
      period: s.period,
      eccentricity: s.eccentricity ?? 0,
      startPhase: s.startPhase ?? 0,
    };
    const angle =
      (p.startPhase * Math.PI) / 180 + ((2 * Math.PI) / p.period) * simDay;
    const r = p.orbitalRadius * (1 - p.eccentricity * Math.cos(angle));
    positions["taunor_minor"] = {
      x: r * Math.cos(angle),
      y: r * Math.sin(angle),
    };
  } else {
    positions["taunor_prime"] = { x: 0, y: 0 };
    // 0.08 AU is accurate but visually they overlap at scene scale — offset by 0.35 AU visually
    const minorAngle = ((2 * Math.PI) / 18) * simDay;
    positions["taunor_minor"] = {
      x: 0.35 * Math.cos(minorAngle),
      y: 0.35 * Math.sin(minorAngle),
    };
  }

  // Lagrange stations at ±60° from taunor_minor
  const minorAngle = Math.atan2(
    positions["taunor_minor"].y,
    positions["taunor_minor"].x,
  );
  const lagrangeR = 0.08;
  positions["l4_station"] = {
    x: lagrangeR * Math.cos(minorAngle + Math.PI / 3),
    y: lagrangeR * Math.sin(minorAngle + Math.PI / 3),
  };
  positions["l5_station"] = {
    x: lagrangeR * Math.cos(minorAngle - Math.PI / 3),
    y: lagrangeR * Math.sin(minorAngle - Math.PI / 3),
  };

  for (const body of systemConfig.bodies ?? []) {
    const p = {
      orbitalRadius: body.orbitalRadius,
      period: body.period,
      eccentricity: body.eccentricity ?? 0,
      startPhase: body.startPhase ?? 0,
    };
    const angle =
      (p.startPhase * Math.PI) / 180 + ((2 * Math.PI) / p.period) * simDay;
    const radius = p.orbitalRadius * (1 - p.eccentricity * Math.cos(angle));
    const localX = radius * Math.cos(angle);
    const localY = radius * Math.sin(angle);

    if (body.parent && positions[body.parent]) {
      // Moon orbital radii are astrophysically accurate but visually tiny at scene scale.
      // Apply a visual scale boost so moons orbit outside their parent's render sphere.
      const MOON_VISUAL_SCALE: Record<string, number> = {
        kalos: 12,
        thal: 16,
        mira: 22, // Vareth moons
        lun: 18,
        vael: 26, // Calyx moons
      };
      const boost = MOON_VISUAL_SCALE[body.id] ?? 1;
      positions[body.id] = {
        x: positions[body.parent].x + localX * boost,
        y: positions[body.parent].y + localY * boost,
      };
    } else {
      positions[body.id] = { x: localX, y: localY };
    }
  }

  return positions;
};

export default computePositions;
