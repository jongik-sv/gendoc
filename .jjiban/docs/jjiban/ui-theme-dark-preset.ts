/**
 * jjiban Dark Theme Preset for PrimeVue 4.x
 * Based on Claude.com design system (Light → Dark mode conversion)
 *
 * Usage in nuxt.config.ts:
 * ```typescript
 * import { JjibanDarkPreset } from './.jjiban/jjiban/ui-theme-dark-preset'
 *
 * export default defineNuxtConfig({
 *   primevue: {
 *     options: {
 *       theme: {
 *         preset: JjibanDarkPreset,
 *         options: {
 *           darkModeSelector: '.dark-mode',
 *           cssLayer: {
 *             name: 'primevue',
 *             order: 'tailwind-base, primevue, tailwind-utilities'
 *           }
 *         }
 *       }
 *     }
 *   }
 * })
 * ```
 */

import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

export const JjibanDarkPreset = definePreset(Aura, {
  semantic: {
    // Primary Color (Clay/Terracotta from Claude.com)
    primary: {
      50: '{clay.50}',
      100: '{clay.100}',
      200: '{clay.200}',
      300: '{clay.300}',
      400: '{clay.400}',
      500: '{clay.500}',
      600: '{clay.600}',
      700: '{clay.700}',
      800: '{clay.800}',
      900: '{clay.900}',
      950: '{clay.950}'
    },

    // Color Palettes
    colorScheme: {
      dark: {
        // Surface Colors (Inverted Gray Scale from Claude.com)
        surface: {
          0: '#0a0a09',
          50: '#141413',
          100: '#1a1918',
          200: '#262624',
          300: '#30302e',
          400: '#3d3d3a',
          500: '#4d4c48',
          600: '#5e5d59',
          700: '#73726c',
          800: '#87867f',
          900: '#9c9a92'
        },

        // Primary (Brand) Colors
        primary: {
          color: '{clay.500}',
          inverseColor: '#141413',
          hoverColor: '{clay.400}',
          activeColor: '{clay.600}'
        },

        // Highlight (Selection)
        highlight: {
          background: 'rgba(217, 119, 87, 0.2)',
          focusBackground: 'rgba(217, 119, 87, 0.3)',
          color: '{clay.400}',
          focusColor: '{clay.300}'
        },

        // Content Colors
        content: {
          background: '{surface.100}',
          hoverBackground: '{surface.200}',
          borderColor: '{surface.400}',
          color: '#f5f4ed',
          hoverColor: '#ffffff'
        },

        // Text Colors
        text: {
          color: '#f5f4ed',
          hoverColor: '#ffffff',
          mutedColor: '#73726c',
          hoverMutedColor: '#87867f'
        },

        // Mask/Overlay
        mask: {
          background: 'rgba(0, 0, 0, 0.7)',
          color: '{surface.300}'
        },

        // Form Elements
        formField: {
          background: '{surface.50}',
          disabledBackground: '{surface.300}',
          filledBackground: '{surface.100}',
          filledHoverBackground: '{surface.200}',
          filledFocusBackground: '{surface.100}',
          borderColor: '{surface.400}',
          hoverBorderColor: '{surface.500}',
          focusBorderColor: '{clay.500}',
          invalidBorderColor: '#ef4444',
          color: '#f5f4ed',
          disabledColor: '{surface.600}',
          placeholderColor: '#73726c',
          invalidPlaceholderColor: '#f87171',
          floatLabelColor: '#73726c',
          floatLabelFocusColor: '{clay.400}',
          floatLabelActiveColor: '#9c9a92',
          floatLabelInvalidColor: '#ef4444',
          iconColor: '#73726c',
          shadow: '0 0 0 0.125rem rgba(217, 119, 87, 0.2)'
        },

        // Navigation
        navigation: {
          item: {
            focusBackground: '{surface.200}',
            activeBackground: '{surface.200}',
            color: '#9c9a92',
            focusColor: '#f5f4ed',
            activeColor: '#f5f4ed',
            icon: {
              color: '#73726c',
              focusColor: '#9c9a92',
              activeColor: '{clay.500}'
            }
          },
          submenuLabel: {
            background: 'transparent',
            color: '#73726c'
          },
          submenuIcon: {
            color: '#73726c',
            focusColor: '#9c9a92',
            activeColor: '{clay.500}'
          }
        }
      }
    }
  },

  // Custom Color Definitions
  primitive: {
    // Clay (Primary Accent from Claude.com)
    clay: {
      50: '#fef7f5',
      100: '#fdeee9',
      200: '#fbd5c9',
      300: '#f7b8a3',
      400: '#e8936f',
      500: '#d97757',
      600: '#c96442',
      700: '#a84d32',
      800: '#8a3f2a',
      900: '#723526',
      950: '#3d1a12'
    },

    // Additional Accent Colors
    oat: {
      50: '#f7f5f0',
      100: '#ebe6db',
      200: '#e3dacc',
      300: '#d4c8b5',
      400: '#bfad94',
      500: '#a8927a',
      600: '#8a7663',
      700: '#6d5c4e',
      800: '#574a40',
      900: '#473d36',
      950: '#3d3428'
    },

    // WBS Hierarchy Colors
    wbs: {
      project: '#8b5cf6',
      workPackage: '#3b82f6',
      activity: '#22c55e',
      task: '#f59e0b'
    }
  },

  // Component Overrides
  components: {
    // Button
    button: {
      root: {
        borderRadius: '0.25rem',
        paddingX: '0.75rem',
        paddingY: '0.5rem',
        gap: '0.5rem',
        fontWeight: '500',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      },
      colorScheme: {
        dark: {
          root: {
            primary: {
              background: '#f5f4ed',
              hoverBackground: '#ffffff',
              activeBackground: '#e8e6dc',
              borderColor: '#f5f4ed',
              hoverBorderColor: '#ffffff',
              activeBorderColor: '#e8e6dc',
              color: '#141413'
            },
            secondary: {
              background: '{surface.200}',
              hoverBackground: '{surface.300}',
              activeBackground: '{surface.400}',
              borderColor: '{surface.400}',
              hoverBorderColor: '{surface.500}',
              activeBorderColor: '{surface.500}',
              color: '#f5f4ed'
            },
            success: {
              background: '#166534',
              hoverBackground: '#15803d',
              color: '#22c55e'
            },
            info: {
              background: '#1d4ed8',
              hoverBackground: '#2563eb',
              color: '#60a5fa'
            },
            warn: {
              background: '#92400e',
              hoverBackground: '#a16207',
              color: '#fbbf24'
            },
            danger: {
              background: '#991b1b',
              hoverBackground: '#b91c1c',
              color: '#f87171'
            },
            contrast: {
              background: '{clay.600}',
              hoverBackground: '{clay.500}',
              activeBackground: '{clay.700}',
              borderColor: '{clay.600}',
              hoverBorderColor: '{clay.500}',
              activeBorderColor: '{clay.700}',
              color: '#faf9f5'
            }
          },
          outlined: {
            primary: {
              hoverBackground: 'rgba(217, 119, 87, 0.1)',
              activeBackground: 'rgba(217, 119, 87, 0.2)',
              borderColor: '{clay.500}',
              color: '{clay.400}'
            }
          },
          text: {
            primary: {
              hoverBackground: 'rgba(217, 119, 87, 0.1)',
              activeBackground: 'rgba(217, 119, 87, 0.2)',
              color: '{clay.400}'
            }
          }
        }
      }
    },

    // Card
    card: {
      root: {
        background: '{surface.100}',
        borderRadius: '1.5rem',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.3)'
      },
      colorScheme: {
        dark: {
          root: {
            background: '{surface.100}',
            color: '#f5f4ed'
          },
          subtitle: {
            color: '#9c9a92'
          }
        }
      },
      body: {
        padding: '2rem',
        gap: '1rem'
      },
      title: {
        fontWeight: '600',
        fontSize: '1.25rem'
      },
      subtitle: {
        color: '{text.muted.color}'
      }
    },

    // DataTable
    datatable: {
      colorScheme: {
        dark: {
          root: {
            borderColor: '{surface.300}'
          },
          header: {
            background: '{surface.50}',
            borderColor: '{surface.300}',
            color: '#9c9a92',
            hoverColor: '#f5f4ed'
          },
          headerCell: {
            background: '{surface.50}',
            hoverBackground: '{surface.100}',
            selectedBackground: '{surface.100}',
            borderColor: '{surface.300}',
            color: '#9c9a92',
            hoverColor: '#f5f4ed',
            selectedColor: '#f5f4ed',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            focusRing: {
              width: '0.125rem',
              style: 'solid',
              color: '{clay.500}',
              offset: '-0.125rem'
            }
          },
          row: {
            background: '{surface.0}',
            hoverBackground: '{surface.100}',
            selectedBackground: 'rgba(217, 119, 87, 0.15)',
            color: '#f5f4ed',
            hoverColor: '#ffffff',
            selectedColor: '{clay.300}',
            focusRing: {
              width: '0.125rem',
              style: 'solid',
              color: '{clay.500}',
              offset: '-0.125rem'
            }
          },
          bodyCell: {
            borderColor: '{surface.200}',
            padding: '0.75rem 1rem',
            gap: '0.5rem'
          },
          footerCell: {
            background: '{surface.50}',
            borderColor: '{surface.300}',
            color: '#9c9a92',
            padding: '0.75rem 1rem'
          },
          columnFooter: {
            background: '{surface.50}',
            borderColor: '{surface.300}',
            color: '#9c9a92',
            padding: '0.75rem 1rem'
          },
          footer: {
            background: '{surface.50}',
            borderColor: '{surface.300}',
            color: '#9c9a92',
            padding: '0.75rem 1rem'
          }
        }
      }
    },

    // Dialog/Modal
    dialog: {
      root: {
        background: '{surface.100}',
        borderRadius: '1rem',
        padding: '0'
      },
      colorScheme: {
        dark: {
          root: {
            background: '{surface.100}',
            borderColor: '{surface.300}',
            color: '#f5f4ed'
          },
          header: {
            background: 'transparent',
            color: '#f5f4ed',
            padding: '1.5rem 1.5rem 0.75rem 1.5rem'
          },
          content: {
            background: 'transparent',
            color: '#f5f4ed',
            padding: '0.75rem 1.5rem'
          },
          footer: {
            background: 'transparent',
            padding: '0.75rem 1.5rem 1.5rem 1.5rem'
          }
        }
      }
    },

    // InputText
    inputtext: {
      root: {
        background: '{surface.50}',
        borderRadius: '0.5rem',
        paddingX: '0.75rem',
        paddingY: '0.5rem'
      },
      colorScheme: {
        dark: {
          root: {
            background: '{surface.50}',
            hoverBackground: '{surface.100}',
            focusBackground: '{surface.100}',
            borderColor: '{surface.400}',
            hoverBorderColor: '{surface.500}',
            focusBorderColor: '{clay.500}',
            invalidBorderColor: '#ef4444',
            color: '#f5f4ed',
            placeholderColor: '#73726c',
            shadow: 'none',
            focusRing: {
              width: '0',
              style: 'none',
              color: 'transparent',
              offset: '0'
            }
          }
        }
      }
    },

    // Select/Dropdown
    select: {
      root: {
        background: '{surface.50}',
        borderRadius: '0.5rem',
        paddingX: '0.75rem',
        paddingY: '0.5rem'
      },
      colorScheme: {
        dark: {
          root: {
            background: '{surface.50}',
            hoverBackground: '{surface.100}',
            focusBackground: '{surface.100}',
            borderColor: '{surface.400}',
            hoverBorderColor: '{surface.500}',
            focusBorderColor: '{clay.500}',
            color: '#f5f4ed',
            placeholderColor: '#73726c'
          },
          dropdown: {
            background: '{surface.100}',
            borderColor: '{surface.300}',
            color: '#73726c',
            hoverColor: '#9c9a92'
          },
          overlay: {
            background: '{surface.100}',
            borderColor: '{surface.300}',
            shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)'
          },
          option: {
            focusBackground: '{surface.200}',
            selectedBackground: 'rgba(217, 119, 87, 0.15)',
            selectedFocusBackground: 'rgba(217, 119, 87, 0.25)',
            color: '#f5f4ed',
            focusColor: '#ffffff',
            selectedColor: '{clay.300}',
            selectedFocusColor: '{clay.200}'
          },
          optionGroup: {
            background: 'transparent',
            color: '#73726c'
          }
        }
      }
    },

    // Tag/Badge
    tag: {
      root: {
        borderRadius: '9999px',
        paddingX: '0.625rem',
        paddingY: '0.25rem',
        gap: '0.25rem',
        fontWeight: '500',
        fontSize: '0.75rem'
      },
      colorScheme: {
        dark: {
          root: {
            primary: {
              background: 'rgba(217, 119, 87, 0.2)',
              color: '{clay.400}'
            },
            secondary: {
              background: '{surface.300}',
              color: '#9c9a92'
            },
            success: {
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e'
            },
            info: {
              background: 'rgba(59, 130, 246, 0.2)',
              color: '#60a5fa'
            },
            warn: {
              background: 'rgba(245, 158, 11, 0.2)',
              color: '#fbbf24'
            },
            danger: {
              background: 'rgba(239, 68, 68, 0.2)',
              color: '#f87171'
            },
            contrast: {
              background: '#f5f4ed',
              color: '#141413'
            }
          }
        }
      }
    },

    // TabView/Tabs
    tabs: {
      colorScheme: {
        dark: {
          tablist: {
            background: '{surface.100}',
            borderColor: '{surface.300}'
          },
          tab: {
            background: 'transparent',
            hoverBackground: '{surface.200}',
            activeBackground: '{surface.100}',
            borderColor: 'transparent',
            hoverBorderColor: 'transparent',
            activeBorderColor: '{clay.500}',
            color: '#73726c',
            hoverColor: '#9c9a92',
            activeColor: '#f5f4ed',
            padding: '0.75rem 1.25rem'
          },
          tabpanel: {
            background: 'transparent',
            color: '#f5f4ed',
            padding: '1rem 0'
          }
        }
      }
    },

    // Tree
    tree: {
      colorScheme: {
        dark: {
          root: {
            background: 'transparent',
            color: '#f5f4ed',
            padding: '0.5rem',
            gap: '0.25rem'
          },
          node: {
            padding: '0.25rem 0.5rem',
            borderRadius: '0.5rem',
            hoverBackground: '{surface.200}',
            selectedBackground: 'rgba(217, 119, 87, 0.15)',
            color: '#f5f4ed',
            hoverColor: '#ffffff',
            selectedColor: '{clay.300}'
          },
          nodeToggleButton: {
            borderRadius: '0.25rem',
            size: '1.5rem',
            hoverBackground: '{surface.300}',
            selectedHoverBackground: 'rgba(217, 119, 87, 0.25)',
            color: '#73726c',
            hoverColor: '#9c9a92',
            selectedHoverColor: '{clay.300}',
            focusRing: {
              width: '0.125rem',
              style: 'solid',
              color: '{clay.500}',
              offset: '-0.125rem'
            }
          },
          nodeIcon: {
            color: '#73726c',
            hoverColor: '#9c9a92',
            selectedColor: '{clay.400}'
          }
        }
      }
    },

    // Toast
    toast: {
      root: {
        borderRadius: '0.75rem'
      },
      colorScheme: {
        dark: {
          root: {
            background: '{surface.100}',
            borderColor: '{surface.300}'
          },
          icon: {
            size: '1.25rem'
          },
          content: {
            gap: '0.5rem',
            padding: '1rem'
          },
          text: {
            gap: '0.25rem'
          },
          summary: {
            fontWeight: '600',
            color: '#f5f4ed',
            fontSize: '1rem'
          },
          detail: {
            fontWeight: '400',
            color: '#9c9a92',
            fontSize: '0.875rem'
          },
          closeButton: {
            size: '1.5rem',
            borderRadius: '0.25rem',
            hoverBackground: '{surface.200}',
            focusRing: {
              width: '0.125rem',
              style: 'solid',
              color: '{clay.500}',
              offset: '-0.125rem'
            }
          },
          closeIcon: {
            size: '0.75rem',
            color: '#73726c',
            hoverColor: '#9c9a92'
          },
          success: {
            background: 'color-mix(in srgb, {surface.100}, #22c55e 10%)',
            borderColor: 'color-mix(in srgb, {surface.300}, #22c55e 30%)',
            color: '#22c55e',
            shadow: '0 4px 6px -1px rgba(34, 197, 94, 0.2)'
          },
          info: {
            background: 'color-mix(in srgb, {surface.100}, #3b82f6 10%)',
            borderColor: 'color-mix(in srgb, {surface.300}, #3b82f6 30%)',
            color: '#60a5fa',
            shadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
          },
          warn: {
            background: 'color-mix(in srgb, {surface.100}, #f59e0b 10%)',
            borderColor: 'color-mix(in srgb, {surface.300}, #f59e0b 30%)',
            color: '#fbbf24',
            shadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)'
          },
          error: {
            background: 'color-mix(in srgb, {surface.100}, #ef4444 10%)',
            borderColor: 'color-mix(in srgb, {surface.300}, #ef4444 30%)',
            color: '#f87171',
            shadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
          }
        }
      }
    },

    // ProgressBar
    progressbar: {
      root: {
        height: '0.5rem',
        borderRadius: '9999px'
      },
      colorScheme: {
        dark: {
          root: {
            background: '{surface.300}'
          },
          value: {
            background: '{clay.500}'
          }
        }
      }
    },

    // Menu
    menu: {
      colorScheme: {
        dark: {
          root: {
            background: '{surface.100}',
            borderColor: '{surface.300}',
            color: '#f5f4ed',
            borderRadius: '0.5rem',
            shadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -4px rgba(0, 0, 0, 0.4)'
          },
          list: {
            padding: '0.25rem',
            gap: '0.125rem'
          },
          item: {
            focusBackground: '{surface.200}',
            activeBackground: '{surface.200}',
            color: '#f5f4ed',
            focusColor: '#ffffff',
            activeColor: '#ffffff',
            borderRadius: '0.25rem',
            padding: '0.5rem 0.75rem',
            gap: '0.5rem'
          },
          itemIcon: {
            color: '#73726c',
            focusColor: '#9c9a92',
            activeColor: '{clay.400}'
          },
          separator: {
            borderColor: '{surface.300}'
          },
          submenuLabel: {
            background: 'transparent',
            color: '#73726c',
            padding: '0.5rem 0.75rem',
            fontWeight: '600'
          }
        }
      }
    },

    // Checkbox
    checkbox: {
      root: {
        borderRadius: '0.25rem',
        width: '1.25rem',
        height: '1.25rem'
      },
      colorScheme: {
        dark: {
          root: {
            borderColor: '{surface.400}',
            hoverBorderColor: '{surface.500}',
            focusBorderColor: '{clay.500}',
            checkedBackground: '{clay.500}',
            checkedHoverBackground: '{clay.400}',
            checkedBorderColor: '{clay.500}',
            checkedHoverBorderColor: '{clay.400}',
            invalidBorderColor: '#ef4444',
            shadow: 'none',
            focusRing: {
              width: '0.125rem',
              style: 'solid',
              color: '{clay.500}',
              offset: '0.125rem'
            }
          },
          icon: {
            size: '0.875rem',
            color: '#ffffff',
            checkedColor: '#ffffff',
            checkedHoverColor: '#ffffff',
            disabledColor: '{surface.600}'
          }
        }
      }
    },

    // Skeleton
    skeleton: {
      colorScheme: {
        dark: {
          root: {
            background: '{surface.300}',
            animationBackground: 'linear-gradient(90deg, {surface.300}, {surface.200}, {surface.300})'
          }
        }
      }
    }
  }
})

// Export type for TypeScript support
export type JjibanDarkPresetType = typeof JjibanDarkPreset
