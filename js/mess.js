// mess.js — shared mess score and tier, derived from object systems

export function createMess(ctx) {

  function score() {
    const dishScore = Math.min(5, ctx.dishes.inSinkCount()) * 9;
    const bedScore = ctx.linens.bedState() === 'messy' ? 15 : ctx.linens.bedState() === 'unmade' ? 5 : 0;
    const towelScore = ctx.linens.towelState() === 'on_floor' ? 8 : 0;
    const clothingBedScore = ctx.clothing.itemsOnFloor('bedroom').length * 8;
    const clothingBathScore = ctx.clothing.itemsOnFloor('bathroom').length * 5;
    // Item disorder: displaced or disordered items add to visual mess.
    // Each spot's disorder (0–1) scaled by 8 → max ~48 from 6 spots at full disorder.
    const itemDisorderScore = ctx.items.totalDisorder() * 8;
    return Math.min(100, dishScore + bedScore + towelScore + clothingBedScore + clothingBathScore + itemDisorderScore);
  }

  function tier() {
    const s = score();
    if (s >= 70) return 'chaotic';
    if (s >= 45) return 'messy';
    if (s >= 20) return 'cluttered';
    return 'tidy';
  }

  return { score, tier };
}
