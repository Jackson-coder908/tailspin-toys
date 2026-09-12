import type { Game } from '../types/game';

export type GameSort = 'title-asc' | 'title-desc' | 'rating-desc';

const titleCompare = (left: Game, right: Game): number =>
    left.title.localeCompare(right.title);

/**
 * Sort games without mutating the input. Unrated games are placed last when
 * sorting by rating, and equal ratings are ordered alphabetically.
 */
export function sortGames(games: readonly Game[], sort: GameSort): Game[] {
    return [...games].sort((left, right) => {
        if (sort === 'title-desc') {
            return titleCompare(right, left);
        }

        if (sort === 'rating-desc') {
            if (left.starRating === null && right.starRating === null) {
                return titleCompare(left, right);
            }
            if (left.starRating === null) {
                return 1;
            }
            if (right.starRating === null) {
                return -1;
            }

            const ratingDifference = right.starRating - left.starRating;
            return ratingDifference === 0 ? titleCompare(left, right) : ratingDifference;
        }

        return titleCompare(left, right);
    });
}
