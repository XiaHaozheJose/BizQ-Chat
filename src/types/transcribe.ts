export interface TranscribeResponse {
  success: boolean;
  text: string;
  chunks: TranscribeChunk[];
}

export interface TranscribeChunk {
  timestamp: {
    start: number;
    end: number;
  };
  text: string;
}
