/** Sort reservations with newest bookings first (by createdAt). */
export const sortReservationsByCreatedAt = (reservations = []) =>
  [...reservations].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });
