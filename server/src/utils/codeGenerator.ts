import { GameRoom } from "../types/game";

const SAFE_CHARACTERS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateRoomCode(existingRooms: Map<string, GameRoom>): string {
  /*
  Grabs a random character from the SAFE_CHARACTERS (via random index selection)
  Repeat total of 6 times for a 6 character code
  Check to see if generated code is in any existing rooms, if so repeat until code is unique
  */
  let roomCode: string;

  do {
    roomCode = "";
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * SAFE_CHARACTERS.length);
      roomCode += SAFE_CHARACTERS[randomIndex];
    }
  } while (existingRooms.has(roomCode));

  return roomCode;
}
