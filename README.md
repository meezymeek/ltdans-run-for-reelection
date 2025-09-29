# RERUN: Danny Boy Runs for Office Again

A mobile-first endless runner game where you help Danny Boy win his re-election campaign!

## Game Features

- **Mobile-First Design**: Optimized for touch devices with responsive canvas
- **Touch Controls**: 
  - Tap anywhere to make Danny Boy jump
  - Swipe down to crouch under obstacles
- **Endless Runner Mechanics**: 
  - Avoid obstacles to keep the campaign going
  - Score increases over time and distance
  - Progressive difficulty scaling
- **Political Theme**: Help Danny Boy navigate the campaign trail!

## Technical Details

- **Pure Web Technologies**: HTML5 Canvas, CSS3, and Vanilla JavaScript
- **No Dependencies**: Lightweight and fast-loading
- **Responsive Design**: Works on all screen sizes and orientations
- **Performance Optimized**: 60fps gameplay with efficient rendering
- **Configurable Architecture**: Easy to adjust difficulty and game parameters
- **Mobile Viewport/Canvas Sizing**: Robust handling of mobile viewport changes, including on-screen keyboard interactions

### Mobile Viewport Handling

The game includes specialized handling for mobile viewport changes to prevent canvas distortion:

- **Automatic Re-measurement**: Canvas is re-measured before each new game and when returning to menu
- **Keyboard Detection**: Uses `visualViewport` API to detect mobile keyboard open/close events
- **Viewport Hardening**: Uses `100dvh` CSS units with fallbacks for consistent mobile viewport behavior
- **Debug Mode**: Add `?debug=viewport` to URL for viewport debugging information

This prevents the "squish" effect that can occur on mobile devices when the on-screen keyboard opens during score submission.

## Game Controls

- **Mobile**: 
  - Tap screen to jump
  - Swipe down to crouch
- **Desktop**: 
  - Click to jump (for testing)

## Deployment

This game is designed to be deployed as a static website and works on any web server that can serve HTML, CSS, and JavaScript files.

## Campaign Strategy

Help Danny Boy avoid the obstacles in his path to re-election! Jump over low barriers and crouch under high ones. The further you go, the higher your campaign score!

---

*"Run Forest Run... but this time it's Danny Boy running for office!"*
