/**
 * curl -X 'POST' \
  'http://127.0.0.1:8000/transcribe/' \
  -H 'accept: application/json' \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@es.m4a;type=audio/x-m4a'
 */
/**
 * {
  "success": true,
  "text": " Hola, me llamo Alex. Un poco rápido. Un poco rápido.",
  "chunks": [
    {
      "timestamp": {
        "start": 0,
        "end": 2.26
      },
      "text": " Hola, me llamo Alex."
    },
    {
      "timestamp": {
        "start": 3.38,
        "end": 4.48
      },
      "text": " Un poco rápido."
    },
    {
      "timestamp": {
        "start": 5.26,
        "end": 6.6
      },
      "text": " Un poco rápido."
    }
  ]
}
 */

import axios from "axios";
import type { TranscribeResponse } from "@/types/transcribe";

/**
 * const formData = new FormData();
formData.append('file', audioFile); // audioFile应该是一个有效的File对象

await axios.post('http://127.0.0.1:8000/transcribe/', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
 */
export const transcribe = (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  return axios.post<TranscribeResponse>(
    "http://127.0.0.1:8000/transcribe/",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};
