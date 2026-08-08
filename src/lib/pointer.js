/**
 * One pointer, shared by every canvas.
 *
 * Four independent scenes each attaching their own mousemove listener would be
 * four listeners doing identical work. This module owns a single listener and
 * exposes a mutable, normalised target that scenes damp toward in useFrame.
 * Values are in [-1, 1] with the origin at the viewport centre.
 */

export const pointerTarget = { x: 0, y: 0 }

let listening = false
let refCount = 0

function onPointerMove(event) {
  pointerTarget.x = (event.clientX / window.innerWidth) * 2 - 1
  pointerTarget.y = -((event.clientY / window.innerHeight) * 2 - 1)
}

function onPointerLeave() {
  pointerTarget.x = 0
  pointerTarget.y = 0
}

/**
 * Subscribes the shared listener. Returns an unsubscribe function; the
 * listener is torn down once the last consumer leaves.
 */
export function attachPointer() {
  refCount += 1
  if (!listening) {
    // Touch devices have no hover, and a coarse pointer parallax reads as jitter.
    const fine = window.matchMedia('(pointer: fine)').matches
    if (fine) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.addEventListener('pointerleave', onPointerLeave)
    }
    listening = true
  }

  return () => {
    refCount -= 1
    if (refCount <= 0 && listening) {
      window.removeEventListener('pointermove', onPointerMove)
      document.removeEventListener('pointerleave', onPointerLeave)
      listening = false
      refCount = 0
      pointerTarget.x = 0
      pointerTarget.y = 0
    }
  }
}
