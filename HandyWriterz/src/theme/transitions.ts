import { alpha } from '@mui/material';

export const TRANSITION_DURATION = 200;

export const getTransitions = (theme: string) => ({
  // Base transitions for all components
  defaults: {
    transition: `all ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  },

  // Component-specific transitions
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          transition: `background-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          transition: `background-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          transition: `background-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
                      color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
                      border-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
                      box-shadow ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: `background-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
                      color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          transition: `background-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
                      color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            transition: `background-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
                        border-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          transition: `background-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
                      border-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          transition: `background-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1),
                      border-color ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        },
      },
    },
  },

  // Animation keyframes
  keyframes: {
    fadeIn: {
      '0%': {
        opacity: 0,
      },
      '100%': {
        opacity: 1,
      },
    },
    slideInFromRight: {
      '0%': {
        transform: 'translateX(100%)',
      },
      '100%': {
        transform: 'translateX(0)',
      },
    },
    slideInFromBottom: {
      '0%': {
        transform: 'translateY(100%)',
      },
      '100%': {
        transform: 'translateY(0)',
      },
    },
    scaleIn: {
      '0%': {
        transform: 'scale(0.95)',
        opacity: 0,
      },
      '100%': {
        transform: 'scale(1)',
        opacity: 1,
      },
    },
  },

  // Animation mixins
  mixins: {
    fadeIn: {
      animation: `fadeIn ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    slideInFromRight: {
      animation: `slideInFromRight ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    slideInFromBottom: {
      animation: `slideInFromBottom ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
    scaleIn: {
      animation: `scaleIn ${TRANSITION_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    },
  },
});
