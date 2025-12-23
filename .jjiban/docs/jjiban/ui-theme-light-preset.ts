/**
 * jjiban Light Theme Preset
 *
 * Source: Dribbble Finance Dashboard Design
 * Theme Type: Light
 *
 * @description Modern, clean light theme with purple accent
 * Based on PrimeVue 4.x Aura preset
 */

import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';

/**
 * Color Palette
 */
const colors = {
  // Primary - Purple/Violet
  primary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#7c5cfc',
    600: '#6d4de6',
    700: '#5b3fd1',
    800: '#4c33b3',
    900: '#3f2a94',
    950: '#271a5e'
  },
  // Surface - Light Gray
  surface: {
    0: '#ffffff',
    50: '#fafafa',
    100: '#f5f5f7',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712'
  }
};

/**
 * JjibanLight Preset
 * PrimeVue 4.x definePreset based theme
 */
export const JjibanLight = definePreset(Aura, {
  semantic: {
    // Primary color mapping
    primary: colors.primary,

    // Color scheme
    colorScheme: {
      light: {
        // Primary semantic colors
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}'
        },

        // Surface & Background
        surface: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f5f5f7',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712'
        },

        // Highlight colors (selection, focus)
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}'
        },

        // Text colors
        text: {
          color: '{surface.900}',
          hoverColor: '{surface.800}',
          mutedColor: '{surface.500}',
          hoverMutedColor: '{surface.600}'
        },

        // Content (cards, panels)
        content: {
          background: '{surface.0}',
          hoverBackground: '{surface.50}',
          borderColor: '{surface.200}',
          color: '{text.color}',
          hoverColor: '{text.hoverColor}'
        },

        // Form elements
        formField: {
          background: '{surface.0}',
          disabledBackground: '{surface.100}',
          filledBackground: '{surface.50}',
          filledHoverBackground: '{surface.100}',
          filledFocusBackground: '{surface.50}',
          borderColor: '{surface.200}',
          hoverBorderColor: '{surface.300}',
          focusBorderColor: '{primary.500}',
          invalidBorderColor: '#ef4444',
          color: '{surface.900}',
          disabledColor: '{surface.400}',
          placeholderColor: '{surface.400}',
          invalidPlaceholderColor: '#ef4444',
          floatLabelColor: '{surface.500}',
          floatLabelFocusColor: '{primary.600}',
          floatLabelActiveColor: '{surface.500}',
          floatLabelInvalidColor: '#ef4444',
          iconColor: '{surface.400}',
          shadow: 'none'
        },

        // Navigation
        navigation: {
          item: {
            focusBackground: '{surface.100}',
            activeBackground: '{surface.900}',
            color: '{surface.600}',
            focusColor: '{surface.800}',
            activeColor: '#ffffff',
            icon: {
              color: '{surface.400}',
              focusColor: '{surface.600}',
              activeColor: '#ffffff'
            }
          },
          submenuLabel: {
            background: 'transparent',
            color: '{surface.500}'
          },
          submenuIcon: {
            color: '{surface.400}',
            focusColor: '{surface.600}',
            activeColor: '#ffffff'
          }
        }
      }
    }
  },

  components: {
    // Button overrides
    button: {
      root: {
        borderRadius: '0.5rem',
        paddingX: '1rem',
        paddingY: '0.625rem',
        gap: '0.5rem'
      },
      colorScheme: {
        light: {
          root: {
            primary: {
              background: '{primary.500}',
              hoverBackground: '{primary.600}',
              activeBackground: '{primary.700}',
              borderColor: '{primary.500}',
              hoverBorderColor: '{primary.600}',
              activeBorderColor: '{primary.700}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff'
            },
            secondary: {
              background: '{surface.100}',
              hoverBackground: '{surface.200}',
              activeBackground: '{surface.300}',
              borderColor: '{surface.100}',
              hoverBorderColor: '{surface.200}',
              activeBorderColor: '{surface.300}',
              color: '{surface.700}',
              hoverColor: '{surface.800}',
              activeColor: '{surface.900}'
            },
            // Dark button (like navigation active)
            contrast: {
              background: '{surface.900}',
              hoverBackground: '{surface.800}',
              activeBackground: '{surface.700}',
              borderColor: '{surface.900}',
              hoverBorderColor: '{surface.800}',
              activeBorderColor: '{surface.700}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff'
            }
          }
        }
      }
    },

    // Card overrides
    card: {
      root: {
        background: '{surface.0}',
        borderRadius: '1rem',
        color: '{surface.900}',
        shadow: '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06)'
      },
      body: {
        padding: '1.5rem',
        gap: '1rem'
      },
      title: {
        fontWeight: '600',
        fontSize: '1.125rem'
      },
      subtitle: {
        color: '{surface.500}'
      }
    },

    // InputText overrides
    inputtext: {
      root: {
        background: '{surface.0}',
        borderColor: '{surface.200}',
        hoverBorderColor: '{surface.300}',
        focusBorderColor: '{primary.500}',
        borderRadius: '0.5rem',
        color: '{surface.900}',
        placeholderColor: '{surface.400}',
        paddingX: '0.875rem',
        paddingY: '0.625rem'
      }
    },

    // Tag/Badge overrides
    tag: {
      root: {
        borderRadius: '9999px',
        paddingX: '0.75rem',
        paddingY: '0.25rem',
        fontWeight: '500',
        fontSize: '0.75rem'
      },
      colorScheme: {
        light: {
          primary: {
            background: '{primary.100}',
            color: '{primary.700}'
          },
          success: {
            background: '#d1fae5',
            color: '#047857'
          },
          info: {
            background: '#dbeafe',
            color: '#1d4ed8'
          },
          warn: {
            background: '#fef3c7',
            color: '#b45309'
          },
          danger: {
            background: '#fee2e2',
            color: '#b91c1c'
          },
          secondary: {
            background: '{surface.100}',
            color: '{surface.600}'
          }
        }
      }
    },

    // DataTable overrides
    datatable: {
      root: {
        borderColor: '{surface.200}'
      },
      headerRow: {
        background: '{surface.50}',
        color: '{surface.600}',
        fontWeight: '600'
      },
      row: {
        background: '{surface.0}',
        hoverBackground: '{surface.50}',
        color: '{surface.900}'
      },
      bodyCell: {
        borderColor: '{surface.100}'
      }
    },

    // Dialog overrides
    dialog: {
      root: {
        background: '{surface.0}',
        borderRadius: '1rem',
        borderColor: '{surface.100}',
        color: '{surface.900}',
        shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      },
      header: {
        padding: '1.5rem 1.5rem 1rem 1.5rem'
      },
      content: {
        padding: '0 1.5rem 1.5rem 1.5rem'
      },
      footer: {
        padding: '1rem 1.5rem 1.5rem 1.5rem'
      }
    },

    // Menu overrides
    menu: {
      root: {
        background: '{surface.0}',
        borderColor: '{surface.200}',
        borderRadius: '0.75rem',
        shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)'
      },
      item: {
        focusBackground: '{surface.100}',
        color: '{surface.700}',
        focusColor: '{surface.900}',
        borderRadius: '0.5rem'
      }
    },

    // ProgressBar overrides
    progressbar: {
      root: {
        background: '{surface.200}',
        borderRadius: '9999px',
        height: '0.5rem'
      },
      value: {
        background: '{primary.500}'
      }
    },

    // Tree overrides (for WBS)
    tree: {
      root: {
        background: '{surface.0}',
        color: '{surface.900}'
      },
      node: {
        padding: '0.5rem 0',
        borderRadius: '0.5rem',
        hoverBackground: '{surface.100}',
        selectedBackground: '{primary.50}',
        selectedColor: '{primary.700}'
      },
      nodeToggleButton: {
        hoverBackground: '{surface.200}',
        selectedHoverBackground: '{primary.100}',
        color: '{surface.500}',
        hoverColor: '{surface.700}',
        selectedHoverColor: '{primary.700}',
        size: '1.5rem',
        borderRadius: '0.375rem'
      }
    },

    // Skeleton overrides
    skeleton: {
      root: {
        background: '{surface.200}',
        animationBackground: 'linear-gradient(90deg, {surface.200} 25%, {surface.100} 50%, {surface.200} 75%)'
      }
    }
  }
});

/**
 * Semantic Colors for direct CSS usage
 */
export const semanticColors = {
  // Status colors
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fee2e2',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  // WBS hierarchy colors (from TRD)
  project: '#8b5cf6',
  workPackage: '#3b82f6',
  activity: '#22c55e',
  task: '#f59e0b'
};

/**
 * Chart color palette
 */
export const chartColors = {
  palette: ['#7c5cfc', '#5b8def', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  available: '#ef4444',
  planned: '#f59e0b',
  other: '#3b82f6'
};

export default JjibanLight;
