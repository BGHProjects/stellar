// @ts-check

/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  technicalSidebar: [
    {
      type: "category",
      label: "Technical Docs",
      items: [
        "technical/architecture",
        "technical/config-system",
        {
          type: "category",
          label: "Frontend",
          items: [
            "technical/frontend/overview",
            "technical/frontend/star-map",
            "technical/frontend/booking-flow",
            "technical/frontend/mock-mode",
          ],
        },
        {
          type: "category",
          label: "Gateway",
          items: [
            "technical/gateway/overview",
            "technical/gateway/auth",
            "technical/gateway/orbital",
          ],
        },
        {
          type: "category",
          label: "Microservices",
          items: [
            "technical/services/ai",
            "technical/services/vision",
            "technical/services/routing",
          ],
        },
        "technical/testing",
      ],
    },
  ],

  systemSidebar: [
    {
      type: "category",
      label: "The Taunor System",
      items: [
        "system/overview",
        "system/binary-stars",
        {
          type: "category",
          label: "Planets & Moons",
          items: [
            "system/bodies/aethon",
            "system/bodies/vareth",
            "system/bodies/calyx",
            "system/bodies/uninhabitable",
          ],
        },
        {
          type: "category",
          label: "The Fleet",
          items: [
            "system/fleet/overview",
            "system/fleet/helion",
            "system/fleet/tethys",
            "system/fleet/lunara",
            "system/fleet/solaris",
          ],
        },
        "system/route-map",
      ],
    },
  ],

  voyagesSidebar: [
    {
      type: "category",
      label: "Voyages",
      items: [
        "voyages/how-voyages-work",
        "voyages/orbital-windows",
        "voyages/scheduling",
        {
          type: "category",
          label: "Booking Options",
          items: [
            "voyages/options/route-types",
            "voyages/options/cryostasis",
            "voyages/options/cabin-classes",
            "voyages/options/packages",
          ],
        },
      ],
    },
  ],
};

module.exports = sidebars;
