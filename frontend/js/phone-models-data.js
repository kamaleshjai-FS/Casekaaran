/**
 * Casekaaran — Phone Model & 3D Case Compatibility Registry
 * Contains complete verified compatibility groups, model aliases, camera specs, and device asset mappings
 */
const PHONE_MODELS_DATA = {
  brands: [
    {
      id: 'samsung',
      name: 'Samsung',
      slug: 'samsung',
      icon: 'bi-phone',
      modelsCount: 23,
      tagline: 'Galaxy S, A, M & F Series'
    },
    {
      id: 'redmi',
      name: 'Redmi',
      slug: 'redmi',
      icon: 'bi-lightning-charge',
      modelsCount: 33,
      tagline: 'Redmi, Note & POCO Series'
    },
    {
      id: 'nothing',
      name: 'Nothing',
      slug: 'nothing',
      icon: 'bi-circle-half',
      modelsCount: 6,
      tagline: 'Phone (a) Series & CMF'
    }
  ],

  models: {
    samsung: [
      { id: 101, name: 'SAM M11/A11', slug: 'samsung-m11-a11', aliases: ['M11', 'A11', 'Samsung M11', 'Samsung A11'], camera: 'Vertical Triple Lens', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 102, name: 'SAM M31/F41', slug: 'samsung-m31-f41', aliases: ['M31', 'F41', 'Samsung M31', 'Samsung F41'], camera: 'L-Shaped Quad Lens', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 103, name: 'SAM A12/M12/F12', slug: 'samsung-a12-m12-f12', aliases: ['A12', 'M12', 'F12', 'Samsung A12', 'Samsung M12', 'Samsung F12'], camera: 'Square Quad Matrix', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 104, name: 'SAM F23', slug: 'samsung-f23', aliases: ['F23', 'Samsung F23', 'Galaxy F23 5G'], camera: 'Vertical Triple Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 105, name: 'SAM A06/M06/F06', slug: 'samsung-a06-m06-f06', aliases: ['A06', 'M06', 'F06', 'Samsung A06', 'Samsung M06', 'Samsung F06'], camera: 'Floating Dual Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 106, name: 'SAM A07/M07/F07/M17E/F70E', slug: 'samsung-a07-m07-f07', aliases: ['A07', 'M07', 'F07', 'M17E', 'F70E', 'Samsung A07'], camera: 'Dual Floating Module', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 107, name: 'A13/A23', slug: 'samsung-a13-a23', aliases: ['A13', 'A23', 'Samsung A13', 'Samsung A23', 'Galaxy A13', 'Galaxy A23'], camera: 'Quad Floating Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 108, name: 'A14/M14', slug: 'samsung-a14-m14', aliases: ['A14', 'M14', 'Samsung A14', 'Samsung M14', 'Galaxy A14 5G'], camera: 'Triple Floating Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 109, name: 'A15/M15/F15', slug: 'samsung-a15-m15-f15', aliases: ['A15', 'M15', 'F15', 'Samsung A15', 'Samsung M15', 'Samsung F15'], camera: 'Key Island Triple Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 110, name: 'A16/M16/F16', slug: 'samsung-a16-m16-f16', aliases: ['A16', 'M16', 'F16', 'Samsung A16', 'Samsung M16', 'Samsung F16'], camera: 'Key Island Triple Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 111, name: 'A17/M17/F17/A26/M36', slug: 'samsung-a17-m17-f17-a26-m36', aliases: ['A17', 'M17', 'F17', 'A26', 'M36', 'Samsung A26', 'Samsung M36'], camera: 'Triple Floating Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 112, name: 'A27/M47', slug: 'samsung-a27-m47', aliases: ['A27', 'M47', 'Samsung A27', 'Samsung M47'], camera: 'Linear Triple Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 113, name: 'A34', slug: 'samsung-a34', aliases: ['A34', 'Samsung A34', 'Galaxy A34 5G'], camera: 'Triple Floating Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 114, name: 'A35 5G/A55 5G', slug: 'samsung-a35-a55-5g', aliases: ['A35', 'A55', 'A35 5G', 'A55 5G', 'Samsung A35', 'Samsung A55', 'Galaxy A55'], camera: 'Premium Glass Triple Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 115, name: 'A36 5G/A56 5G', slug: 'samsung-a36-a56-5g', aliases: ['A36', 'A56', 'A36 5G', 'A56 5G', 'Samsung A36', 'Samsung A56'], camera: 'Refined Linear Triple Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 116, name: 'A37', slug: 'samsung-a37', aliases: ['A37', 'Samsung A37', 'Galaxy A37'], camera: 'Linear Triple Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 117, name: 'S20FE', slug: 'samsung-s20fe', aliases: ['S20FE', 'S20 FE', 'Samsung S20 FE', 'Galaxy S20 Fan Edition'], camera: 'Rectangular Triple Island', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 118, name: 'S21FE', slug: 'samsung-s21fe', aliases: ['S21FE', 'S21 FE', 'Samsung S21 FE', 'Galaxy S21 Fan Edition'], camera: 'Contour Cut Triple Island', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 119, name: 'S24FE', slug: 'samsung-s24fe', aliases: ['S24FE', 'S24 FE', 'Samsung S24 FE', 'Galaxy S24 Fan Edition'], camera: 'Triple Floating Ring', image: 'assets/images/phones/samsung-a-series.jpg' },
      { id: 120, name: 'S24 ULTRA', slug: 'samsung-s24-ultra', aliases: ['S24 ULTRA', 'S24 Ultra', 'Galaxy S24 Ultra', 'S24U', 'Samsung S24 Ultra'], camera: 'Quad Lens + Laser AF Boxy Frame', image: 'assets/images/phones/samsung-s-ultra.jpg' },
      { id: 121, name: 'S25 ULTRA', slug: 'samsung-s25-ultra', aliases: ['S25 ULTRA', 'S25 Ultra', 'Galaxy S25 Ultra', 'S25U', 'Samsung S25 Ultra'], camera: 'Titanium Quad Lens Array', image: 'assets/images/phones/samsung-s-ultra.jpg' },
      { id: 122, name: 'S26 ULTRA', slug: 'samsung-s26-ultra', aliases: ['S26 ULTRA', 'S26 Ultra', 'Galaxy S26 Ultra', 'S26U', 'Samsung S26 Ultra'], camera: 'Advanced Quad Lens Array', image: 'assets/images/phones/samsung-s-ultra.jpg' },
      { id: 123, name: 'S26', slug: 'samsung-s26', aliases: ['S26', 'Galaxy S26', 'Samsung S26'], camera: 'Compact Triple Ring', image: 'assets/images/phones/samsung-a-series.jpg' }
    ],

    redmi: [
      { id: 201, name: 'MI 12 5G / POCO M6 PRO', slug: 'redmi-mi-12-5g-poco-m6-pro', aliases: ['MI 12 5G', 'POCO M6 PRO', 'Redmi 12 5G', 'M6 PRO', 'Poco M6 Pro 5G'], camera: 'Dual Camera Deco Visor', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 202, name: 'MI 13 5G / POCO M6 PLUS', slug: 'redmi-mi-13-5g-poco-m6-plus', aliases: ['MI 13 5G', 'POCO M6 PLUS', 'Redmi 13 5G', 'M6 PLUS', 'Poco M6 Plus 5G'], camera: 'Ring Deco Dual Camera', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 203, name: 'MI 13C 5G / 4G', slug: 'redmi-mi-13c-5g-4g', aliases: ['MI 13C', 'Redmi 13C', '13C', '13C 5G', '13C 4G'], camera: 'Dual Squircle Island', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 204, name: 'MI NOTE 7 / NOTE 7 PRO', slug: 'redmi-note-7-pro', aliases: ['Note 7', 'Note 7 Pro', 'Redmi Note 7', 'Redmi Note 7 Pro', 'MI Note 7'], camera: 'Vertical Dual Pill', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 205, name: 'MI 8 / 8A / 8A DUAL', slug: 'redmi-8-8a-dual', aliases: ['MI 8', '8A', '8A DUAL', 'Redmi 8', 'Redmi 8A', 'Redmi 8A Dual'], camera: 'Center Vertical Dual', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 206, name: 'MI NOTE 8', slug: 'redmi-note-8', aliases: ['Note 8', 'MI Note 8', 'Redmi Note 8'], camera: 'Vertical Quad Strip', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 207, name: 'MI NOTE 8 PRO', slug: 'redmi-note-8-pro', aliases: ['Note 8 Pro', 'MI Note 8 Pro', 'Redmi Note 8 Pro'], camera: 'Center Quad Island', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 208, name: 'MI 12C 4G / POCO C55', slug: 'redmi-12c-poco-c55', aliases: ['MI 12C', 'POCO C55', '12C', 'C55', 'Redmi 12C', 'Poco C55'], camera: 'Square Dual Island + Fingerprint', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 209, name: 'MI 9A / 9I', slug: 'redmi-9a-9i', aliases: ['MI 9A', 'MI 9I', '9A', '9I', 'Redmi 9A', 'Redmi 9i'], camera: 'Vertical Single/Dual Pill', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 210, name: 'MI 9C', slug: 'redmi-9c', aliases: ['MI 9C', '9C', 'Redmi 9C'], camera: 'Square Triple Matrix', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 211, name: 'MI 9 POWER', slug: 'redmi-9-power', aliases: ['MI 9 Power', '9 Power', 'Redmi 9 Power'], camera: 'Vertical Quad Module', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 212, name: 'MI 9 PRIME / POCO M2', slug: 'redmi-9-prime-poco-m2', aliases: ['MI 9 Prime', 'POCO M2', '9 Prime', 'M2', 'Redmi 9 Prime', 'Poco M2'], camera: 'Center Quad Pill', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 213, name: 'MI NOTE 9 4G', slug: 'redmi-note-9-4g', aliases: ['Note 9', 'MI Note 9', 'Redmi Note 9 4G'], camera: 'Square Quad Island', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 214, name: 'MI NOTE 9 PRO 4G / POCO M2 PRO', slug: 'redmi-note-9-pro-poco-m2-pro', aliases: ['Note 9 Pro', 'POCO M2 Pro', 'Redmi Note 9 Pro', 'Note 9 Pro Max'], camera: 'Center Square Quad Matrix', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 215, name: 'MI 10C / 10 POWER', slug: 'redmi-10c-10-power', aliases: ['MI 10C', '10 Power', 'Redmi 10C', 'Redmi 10 Power'], camera: 'Large Square Island', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 216, name: 'MI NOTE 10 4G / NOTE 10S', slug: 'redmi-note-10-note-10s', aliases: ['Note 10', 'Note 10S', 'MI Note 10', 'Redmi Note 10', 'Redmi Note 10S'], camera: 'Silver Ring Quad Module', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 217, name: 'MI NOTE 10T / POCO M3 PRO', slug: 'redmi-note-10t-poco-m3-pro', aliases: ['Note 10T', 'POCO M3 Pro', 'MI Note 10T', 'Redmi Note 10T 5G', 'M3 Pro'], camera: 'Black Visor Triple Island', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 218, name: 'MI NOTE 11T 5G / POCO M4 PRO 5G', slug: 'redmi-note-11t-poco-m4-pro-5g', aliases: ['Note 11T', 'POCO M4 Pro', 'Note 11T 5G', 'M4 Pro 5G', 'Redmi Note 11T'], camera: 'Extended Visor Dual Module', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 219, name: 'MI NOTE 11 / NOTE 11S', slug: 'redmi-note-11-note-11s', aliases: ['Note 11', 'Note 11S', 'Redmi Note 11', 'Redmi Note 11S'], camera: 'Silver Ring Quad Island', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 220, name: 'MI NOTE 11 PRO 4G', slug: 'redmi-note-11-pro-4g', aliases: ['Note 11 Pro', 'Redmi Note 11 Pro 4G', 'Note 11 Pro+'], camera: 'Large Lens Stepped Quad Island', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 221, name: 'MI NOTE 12', slug: 'redmi-note-12', aliases: ['Note 12', 'MI Note 12', 'Redmi Note 12 4G', 'Redmi Note 12 5G'], camera: 'Clear Glass Triple Island', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 222, name: 'MI NOTE 13 5G', slug: 'redmi-note-13-5g', aliases: ['Note 13 5G', 'Note 13', 'Redmi Note 13 5G'], camera: 'Dual Elevated Ring Island', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 223, name: 'MI NOTE 13 PRO 5G', slug: 'redmi-note-13-pro-5g', aliases: ['Note 13 Pro 5G', 'Note 13 Pro', 'Redmi Note 13 Pro 5G'], camera: 'Geometric Deco Triple Island', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 224, name: 'MI NOTE 13 PRO+', slug: 'redmi-note-13-pro-plus', aliases: ['Note 13 Pro+', 'Note 13 Pro Plus', 'Redmi Note 13 Pro+ 5G'], camera: 'Curved Glass Clean Triple Ring', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 225, name: 'MI NOTE 14', slug: 'redmi-note-14', aliases: ['Note 14', 'MI Note 14', 'Redmi Note 14'], camera: 'Squircle Deco Triple Module', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 226, name: 'MI NOTE 14 PRO 5G', slug: 'redmi-note-14-pro-5g', aliases: ['Note 14 Pro 5G', 'Note 14 Pro', 'Redmi Note 14 Pro 5G'], camera: 'Center Squircle Triple Island', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 227, name: 'MI NOTE 15 5G', slug: 'redmi-note-15-5g', aliases: ['Note 15 5G', 'Note 15', 'Redmi Note 15'], camera: 'Integrated Deco Triple Island', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 228, name: 'MI NOTE 15 PRO', slug: 'redmi-note-15-pro', aliases: ['Note 15 Pro', 'Redmi Note 15 Pro'], camera: 'Pro Optical Triple Module', image: 'assets/images/phones/redmi-note.jpg' },
      { id: 229, name: 'MI 15A', slug: 'redmi-15a', aliases: ['MI 15A', '15A', 'Redmi 15A'], camera: 'Dual Camera Pill', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 230, name: 'MI 15C / POCO C85', slug: 'redmi-15c-poco-c85', aliases: ['MI 15C', 'POCO C85', '15C', 'C85', 'Redmi 15C', 'Poco C85'], camera: 'Extended Visor Dual Module', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 231, name: 'MI 15 5G', slug: 'redmi-15-5g', aliases: ['MI 15 5G', '15 5G', 'Redmi 15', 'MI 15'], camera: 'Clean Dual Camera Array', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 232, name: 'MI A4/14C/POCO M7/POCO C75', slug: 'redmi-a4-14c-poco-m7-c75', aliases: ['MI A4', '14C', 'POCO M7', 'POCO C75', 'A4', 'M7', 'C75', 'Redmi A4 5G', 'Redmi 14C'], camera: 'Circular Deco Dual Camera', image: 'assets/images/phones/redmi-dual-cam.svg' },
      { id: 233, name: 'MI A5 / POCO C71', slug: 'redmi-a5-poco-c71', aliases: ['MI A5', 'POCO C71', 'A5', 'C71', 'Redmi A5', 'Poco C71'], camera: 'Clean Dual Camera Module', image: 'assets/images/phones/redmi-dual-cam.svg' }
    ],

    nothing: [
      { id: 301, name: 'NOTHING CMF 1', slug: 'nothing-cmf-1', aliases: ['NOTHING CMF 1', 'CMF 1', 'CMF Phone 1', 'Nothing CMF 1', 'CMF'], camera: 'Modular Vertical Dual Lens + Dial', image: 'assets/images/phones/nothing-cmf-1.svg' },
      { id: 302, name: 'NOTHING 2A', slug: 'nothing-2a', aliases: ['NOTHING 2A', 'Nothing 2a', 'Phone 2a', '2a', 'Nothing Phone 2a', 'Nothing Phone (2a)'], camera: 'Signature Dual "Eyes" with Glyph LEDs', image: 'assets/images/phones/nothing-phone-2a.svg' },
      { id: 303, name: 'NOTHING 3A', slug: 'nothing-3a', aliases: ['NOTHING 3A', 'Nothing 3a', 'Phone 3a', '3a', 'Nothing Phone 3a', 'Nothing Phone (3a)'], camera: 'Dual Central Cameras + Glyph Array', image: 'assets/images/phones/nothing-phone-2a.svg' },
      { id: 304, name: 'NOTHING 3A PRO', slug: 'nothing-3a-pro', aliases: ['NOTHING 3A PRO', 'Nothing 3a Pro', 'Phone 3a Pro', '3a Pro', 'Nothing Phone 3a Pro'], camera: 'Enhanced Dual Camera with Glyph LEDs', image: 'assets/images/phones/nothing-phone-2a.svg' },
      { id: 305, name: 'NOTHING 4A', slug: 'nothing-4a', aliases: ['NOTHING 4A', 'Nothing 4a', 'Phone 4a', '4a', 'Nothing Phone 4a'], camera: 'Refined Glyph Dual Camera Array', image: 'assets/images/phones/nothing-phone-2a.svg' },
      { id: 306, name: 'NOTHING 4A PRO', slug: 'nothing-4a-pro', aliases: ['NOTHING 4A PRO', 'Nothing 4a Pro', 'Phone 4a Pro', '4a Pro', 'Nothing Phone 4a Pro'], camera: 'Flagship Glyph Dual Camera Array', image: 'assets/images/phones/nothing-phone-2a.svg' }
    ]
  },

  // 3D Cases in inventory compatible across these smartphone models
  cases3D: [
    {
      id: 501,
      name: 'Scuderia Racing 3D Honeycomb Case',
      slug: 'scuderia-racing-3d-honeycomb-case',
      series: 'NEW TRENDING 3D',
      material: '3D Tactile Embossed TPU & Honeycomb Shock Shell',
      base_price: 499,
      original_price: 899,
      in_stock: true,
      stock_quantity: 45,
      rating: 4.9,
      reviews_count: 142,
      primary_image: 'assets/images/3d-cases/trending-3d-ferrari-racing-studio.jpg',
      angle_image: 'assets/images/3d-cases/trending-3d-ferrari-racing-angle.jpg',
      real_photo: 'assets/icons/reference-3d-case.jpeg',
      description: 'Physical 3D embossed Scuderia shield with Italian tricolor racing stripe and tactile hexagonal honeycomb mesh. Engineered with raised camera bezels and reinforced shock-absorbing bumper edges.',
      features: ['Physical 3D Embossed Shield', 'Tricolor Racing Stripe', 'Honeycomb Shock Absorption', 'Tactile Bumper Grip', '100% Precision Camera Cutout']
    },
    {
      id: 502,
      name: 'Black Panther 3D Relief Armor Case',
      slug: 'black-panther-3d-relief-armor-case',
      series: 'NEW TRENDING 3D',
      material: 'Dual-Layer 3D Textured Polycarbonate & German TPU',
      base_price: 499,
      original_price: 849,
      in_stock: true,
      stock_quantity: 38,
      rating: 4.8,
      reviews_count: 98,
      primary_image: 'assets/images/3d-cases/trending-3d-ferrari-racing-angle.jpg',
      angle_image: 'assets/images/3d-cases/trending-3d-ferrari-racing-studio.jpg',
      real_photo: 'assets/icons/reference-3d-case.jpeg',
      description: 'Tactile 3D embossed geometric honeycomb relief in stealth matte black. Engineered for drop resistance with air-cushioned corners.',
      features: ['Deep 3D Tactile Hex Pattern', 'Stealth Matte Black Finish', 'Air-Cushion Corner Suspension', 'Scratch Resistant']
    }
  ]
};

// Export for browser and node
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PHONE_MODELS_DATA;
} else if (typeof window !== 'undefined') {
  window.PHONE_MODELS_DATA = PHONE_MODELS_DATA;
}
