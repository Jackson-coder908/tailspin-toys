import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGameById,
} from './games';
import { sortGames } from './game-sorting';
import type { Game } from '../types/game';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    describe('sortGames', () => {
        const games: Game[] = [
            { id: 1, title: 'Zebra', description: '', starRating: 4.2, category: null, publisher: null },
            { id: 2, title: 'Alpha', description: '', starRating: 4.9, category: null, publisher: null },
            { id: 3, title: 'No Rating', description: '', starRating: null, category: null, publisher: null },
            { id: 4, title: 'Beta', description: '', starRating: 4.9, category: null, publisher: null },
        ];

        it('sorts titles in ascending and descending order without mutating the input', () => {
            expect(sortGames(games, 'title-asc').map((game) => game.title)).toEqual([
                'Alpha', 'Beta', 'No Rating', 'Zebra',
            ]);
            expect(sortGames(games, 'title-desc').map((game) => game.title)).toEqual([
                'Zebra', 'No Rating', 'Beta', 'Alpha',
            ]);
            expect(games.map((game) => game.title)).toEqual(['Zebra', 'Alpha', 'No Rating', 'Beta']);
        });

        it('sorts ratings highest first, puts unrated games last, and breaks ties by title', () => {
            expect(sortGames(games, 'rating-desc').map((game) => game.title)).toEqual([
                'Alpha', 'Beta', 'Zebra', 'No Rating',
            ]);
        });
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });
});
