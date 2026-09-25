# Security Specification - Don't Do It Challenge

## Data Invariants
1. A room must have exactly one host who matches the `hostId`.
2. A player can only see the `card` field of other players, not their own (this prevents cheating).
3. Lives cannot be increased by players, only decreased during a violation action.
4. Only the host can transition room status to `playing`.

## The Dirty Dozen Payloads
1. **Self-Promotion**: Player B tries to set `isHost: true` in an existing room.
2. **Card Peeking**: Player A tries to read their own `card` field (blocked by rules).
3. **Impersonation**: Player A tries to join a room with `playerId` that matches Player B's auth UID.
4. **Life Restoration**: Player A tries to reset their `lives` to 3 after losing.
5. **Topic Hijacking**: Non-host player tries to change the room `topic`.
6. **Ghost Room**: Attempting to create a room without a `createdAt` timestamp.
7. **Invalid Status**: Setting room status to `winning` (not in enum).
8. **Malicious ID**: Creating a room with a 2MB string as ID.
9. **Zombie Update**: Updating a player's state after room status is `game-over`.
10. **Shadow Field**: Adding `isInvincible: true` to player document.
11. **Future Timestamp**: Setting `joinedAt` to 1 hour in the future.
12. **Double Start**: Host trying to set status to `playing` when it's already `playing`.

## Proposed Rules
The rules will enforce:
- `read` for rooms: Any authenticated user.
- `write` for rooms: Only the host.
- `read` for players:
    - If user is the player: Can read all fields EXCEPT `card`.
    - If user is NOT the player: Can read all fields.
- `write` for players:
    - Create: Authenticated user creating their own profile.
    - Update: Own profile (ready status, name) or other player (deducting lives during violation).
