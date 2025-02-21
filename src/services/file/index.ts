export * from "./base";
export * from "./audio";
export * from "./general";

import { AudioFileService } from "./audio";
import { GeneralFileService } from "./general";

// Create service instances
export const audioFileService = new AudioFileService();
export const generalFileService = new GeneralFileService();

// Initialize services with user ID
export const initializeFileServices = async (userId: string) => {
  await Promise.all([
    audioFileService.initialize({ userId }),
    generalFileService.initialize({ userId }),
  ]);
};
