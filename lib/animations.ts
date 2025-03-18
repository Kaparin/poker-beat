import { gsap } from "gsap"

/**
 * Animate a card being dealt
 * @param element The card element to animate
 * @param delay Delay before animation starts
 * @param targetX X position to animate to
 * @param targetY Y position to animate to
 */
export function animateCardDeal(element: HTMLElement, delay: number, targetX: number, targetY: number) {
  // Starting position (deck)
  gsap.set(element, {
    x: 0,
    y: 0,
    scale: 0.8,
    rotation: 0,
    opacity: 0,
    zIndex: 10,
  })

  // Animate to target position
  gsap.to(element, {
    x: targetX,
    y: targetY,
    scale: 1,
    rotation: Math.random() * 4 - 2, // Slight random rotation
    opacity: 1,
    duration: 0.5,
    delay,
    ease: "power2.out",
  })
}

/**
 * Animate chips moving to the pot
 * @param element The chip element to animate
 * @param startX Starting X position
 * @param startY Starting Y position
 * @param delay Delay before animation starts
 */
export function animateChipsToPot(element: HTMLElement, startX: number, startY: number, delay: number) {
  // Set starting position
  gsap.set(element, {
    x: startX,
    y: startY,
    scale: 0.8,
    opacity: 1,
    zIndex: 5,
  })

  // Animate to pot
  gsap.to(element, {
    x: 0,
    y: 0,
    scale: 1,
    duration: 0.6,
    delay,
    ease: "back.out(1.7)",
    onComplete: () => {
      // Fade out at the end
      gsap.to(element, {
        opacity: 0,
        duration: 0.3,
        delay: 0.1,
      })
    },
  })
}

/**
 * Animate chips being won
 * @param element The chip element to animate
 * @param targetX Target X position
 * @param targetY Target Y position
 * @param delay Delay before animation starts
 */
export function animateChipsWin(element: HTMLElement, targetX: number, targetY: number, delay: number) {
  // Set starting position (pot)
  gsap.set(element, {
    x: 0,
    y: 0,
    scale: 1,
    opacity: 1,
    zIndex: 5,
  })

  // Animate to winner
  gsap.to(element, {
    x: targetX,
    y: targetY,
    scale: 0.8,
    duration: 0.8,
    delay,
    ease: "power2.out",
    onComplete: () => {
      // Fade out at the end
      gsap.to(element, {
        opacity: 0,
        duration: 0.3,
        delay: 0.1,
      })
    },
  })
}

/**
 * Animate player action highlight
 * @param element The player element to highlight
 */
export function animatePlayerTurn(element: HTMLElement) {
  gsap.fromTo(
    element,
    { boxShadow: "0 0 0 0px rgba(250, 204, 21, 0)" },
    {
      boxShadow: "0 0 0 4px rgba(250, 204, 21, 0.7)",
      duration: 0.5,
      repeat: -1,
      yoyo: true,
    },
  )
}

/**
 * Stop player turn animation
 * @param element The player element to stop animating
 */
export function stopPlayerTurnAnimation(element: HTMLElement) {
  gsap.killTweensOf(element)
  gsap.to(element, {
    boxShadow: "none",
    duration: 0.3,
  })
}

/**
 * Animate winning hand highlight
 * @param element The element to highlight
 */
export function animateWinningHand(element: HTMLElement) {
  gsap.fromTo(
    element,
    { backgroundColor: "rgba(34, 197, 94, 0)" },
    {
      backgroundColor: "rgba(34, 197, 94, 0.2)",
      duration: 0.7,
      repeat: 3,
      yoyo: true,
    },
  )
}

