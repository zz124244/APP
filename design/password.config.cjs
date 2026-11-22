module.exports = {
  "darkMode": "class",
  "theme": {
    "extend": {
      "colors": {
        "on-primary": "#ffffff",
        "surface-container-high": "#dce9ff",
        "outline": "#6d7a72",
        "surface-bright": "#f8f9ff",
        "surface-container-lowest": "#ffffff",
        "tertiary-container": "#6c748b",
        "background": "#f8f9ff",
        "outline-variant": "#bccac0",
        "surface-variant": "#d3e4fe",
        "on-secondary-fixed-variant": "#6e3900",
        "secondary-container": "#fe932c",
        "error": "#ba1a1a",
        "on-surface": "#0b1c30",
        "tertiary-fixed": "#dae2fd",
        "on-primary-container": "#f5fff7",
        "on-secondary-fixed": "#2f1500",
        "on-primary-fixed": "#002114",
        "primary-fixed": "#85f8c4",
        "on-tertiary": "#ffffff",
        "on-primary-fixed-variant": "#005137",
        "surface-dim": "#cbdbf5",
        "on-tertiary-container": "#fefcff",
        "inverse-primary": "#68dba9",
        "on-tertiary-fixed": "#131b2e",
        "tertiary": "#545c72",
        "inverse-on-surface": "#eaf1ff",
        "on-error": "#ffffff",
        "on-background": "#0b1c30",
        "surface": "#f8f9ff",
        "on-tertiary-fixed-variant": "#3f465c",
        "secondary": "#904d00",
        "inverse-surface": "#213145",
        "tertiary-fixed-dim": "#bec6e0",
        "on-secondary-container": "#663500",
        "primary-fixed-dim": "#68dba9",
        "surface-tint": "#006c4a",
        "on-surface-variant": "#3d4a42",
        "primary-container": "#00855d",
        "error-container": "#ffdad6",
        "on-secondary": "#ffffff",
        "secondary-fixed-dim": "#ffb77d",
        "secondary-fixed": "#ffdcc3",
        "on-error-container": "#93000a",
        "surface-container-highest": "#d3e4fe",
        "surface-container-low": "#eff4ff",
        "surface-container": "#e5eeff",
        "primary": "#006948"
      },
      "borderRadius": {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "full": "0.75rem"
      },
      "spacing": {
        "space-xs": "0.25rem",
        "gutter-sm": "1rem",
        "space-md": "1rem",
        "space-sm": "0.5rem",
        "space-xl": "2.5rem",
        "margin": "2rem",
        "space-lg": "1.5rem",
        "gutter": "1.5rem",
        "margin-sm": "1rem"
      },
      "fontFamily": {
        "label-numeric-lg": [
          "JetBrains Mono"
        ],
        "headline-lg-mobile": [
          "Space Grotesk"
        ],
        "headline-sm": [
          "Space Grotesk"
        ],
        "label-numeric-sm": [
          "JetBrains Mono"
        ],
        "body-lg": [
          "Hanken Grotesk"
        ],
        "headline-lg": [
          "Space Grotesk"
        ],
        "display": [
          "Space Grotesk"
        ],
        "headline-md": [
          "Space Grotesk"
        ],
        "label-numeric-md": [
          "JetBrains Mono"
        ],
        "display-mobile": [
          "Space Grotesk"
        ],
        "body-sm": [
          "Hanken Grotesk"
        ],
        "label-caps": [
          "Hanken Grotesk"
        ],
        "body-md": [
          "Hanken Grotesk"
        ]
      },
      "fontSize": {
        "label-numeric-lg": [
          "20px",
          {
            "lineHeight": "28px",
            "letterSpacing": "-0.02em",
            "fontWeight": "500"
          }
        ],
        "headline-lg-mobile": [
          "24px",
          {
            "lineHeight": "32px",
            "letterSpacing": "-0.01em",
            "fontWeight": "600"
          }
        ],
        "headline-sm": [
          "18px",
          {
            "lineHeight": "24px",
            "letterSpacing": "0em",
            "fontWeight": "500"
          }
        ],
        "label-numeric-sm": [
          "11px",
          {
            "lineHeight": "14px",
            "letterSpacing": "0.02em",
            "fontWeight": "400"
          }
        ],
        "body-lg": [
          "16px",
          {
            "lineHeight": "24px",
            "letterSpacing": "-0.01em",
            "fontWeight": "400"
          }
        ],
        "headline-lg": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ],
        "display": [
          "48px",
          {
            "lineHeight": "56px",
            "letterSpacing": "-0.03em",
            "fontWeight": "600"
          }
        ],
        "headline-md": [
          "24px",
          {
            "lineHeight": "32px",
            "letterSpacing": "-0.01em",
            "fontWeight": "500"
          }
        ],
        "label-numeric-md": [
          "14px",
          {
            "lineHeight": "20px",
            "letterSpacing": "0em",
            "fontWeight": "500"
          }
        ],
        "display-mobile": [
          "32px",
          {
            "lineHeight": "40px",
            "letterSpacing": "-0.02em",
            "fontWeight": "600"
          }
        ],
        "body-sm": [
          "12px",
          {
            "lineHeight": "16px",
            "letterSpacing": "0em",
            "fontWeight": "400"
          }
        ],
        "label-caps": [
          "11px",
          {
            "lineHeight": "14px",
            "letterSpacing": "0.06em",
            "fontWeight": "600"
          }
        ],
        "body-md": [
          "14px",
          {
            "lineHeight": "20px",
            "letterSpacing": "0em",
            "fontWeight": "400"
          }
        ]
      }
    }
  },
  "content": [
    "./src/PasswordPage.vue", "./src/ForcedPasswordPage.vue"
  ],
  "important": ".reference-password",
  "corePlugins": {
    "preflight": false
  }
}
