import { readMetadata } from "./openFrames";

export const fetchFrameFromUrl = async (message) => {
  if (typeof message.content === "string") {
    const words = message.content.split(/(\r?\n|\s+)/);
    // Updated regex to better handle URLs with query parameters
    const urlRegex =
      /^(http[s]?:\/\/)?([a-z0-9.-]+\.[a-z0-9]{1,}\/.*|[a-z0-9.-]+\.[a-z0-9]{1,})(\?.*)?$/i;
    try {
      const metadataPromises = words.map(async (word) => {
        const isUrl = !!word.match(urlRegex)?.[0];
        if (isUrl) {
          // Log the URL being processed for debugging
          console.log("Processing URL:", word);
          return await readMetadata(word); // Attempt to fetch metadata for each URL
        }
      });
      const metadataResults = await Promise.all(metadataPromises);
      // Filter out undefined results and return the first valid metadata, if any
      const validMetadata = metadataResults.filter(
        (metadata) => metadata !== undefined,
      );
      return validMetadata[0]; // Return the first valid metadata found, or undefined if none
    } catch (e) {
      console.error(e);
    }
  }
};
