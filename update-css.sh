sed -i '768,825c\
.km-toolbar-float-root {\
  position: fixed;\
  top: 50%;\
  right: 0;\
  transform: translateY(-50%);\
  z-index: 200;\
  pointer-events: none;\
  display: flex;\
  flex-direction: row-reverse;\
  align-items: center;\
}\
\
.km-toolbar-handle {\
  pointer-events: auto;\
  display: flex;\
  align-items: center;\
  justify-content: center;\
  width: 28px;\
  height: 64px;\
  background: var(--km-forest);\
  color: var(--km-text-on-dark);\
  border-radius: var(--km-radius-pill) 0 0 var(--km-radius-pill);\
  cursor: pointer;\
  box-shadow: -2px 0 8px rgba(18, 59, 53, 0.25);\
  opacity: 0.85;\
  transition: opacity 0.2s ease, width 0.2s ease;\
}\
\
.km-toolbar-handle:hover,\
.km-toolbar--revealed ~ .km-toolbar-handle {\
  opacity: 1;\
  width: 34px;\
}\
\
.km-toolbar--float {\
  pointer-events: auto;\
  flex-direction: column;\
  width: auto;\
  height: auto;\
  max-height: 80vh;\
  padding: 1rem 0.5rem;\
  border-right: none;\
  border-left: 1px solid var(--km-border);\
  box-shadow: -4px 4px 20px rgba(0, 0, 0, 0.12);\
  border-radius: var(--km-radius-md) 0 0 var(--km-radius-md);\
  transform: translateX(100%);\
  transition: transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease;\
  opacity: 0;\
}\
\
.km-toolbar--float.km-toolbar--revealed {\
  transform: translateX(0);\
  opacity: 1;\
}\
\
.km-toolbar--float .km-toolbar__group {\
  margin: 0;\
  padding: 0.4rem 0;\
}\
\
.km-toolbar--float .km-toolbar__divider {\
  width: 24px;\
  height: 1px;\
  margin: 0.4rem auto;\
}' src/styles/kerala-modern.css
bash update-css.sh
