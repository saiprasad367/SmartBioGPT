import { useRef, useEffect } from "react";
import { useChatStore } from "@/store/chatStore";

const ProteinViewer = () => {
  const { activeProteinId } = useChatStore();
  // Default to a placeholder if no protein is selected, or hide/show blank state
  // If activeProteinId is set (e.g. "P04637" or "TP53"), we can try to use AlphaFold URL.
  // Note: Uniprot ID is best for AlphaFold. Our bioService returns accession in `data.accession`.

  // The state might hold "TP53" if search used gene name, but bio search returns Accession.
  // We need to ensure logic in ChatInterface sets the Accession preferably.
  // Current logic: `pId = searchRes.data.accession || searchRes.data.name`

  // We just pass the ID and let molstar.html handle the PDB resolution (UniProt -> RCSB).
  const viewerUrl = activeProteinId
    ? `/molstar.html?id=${activeProteinId}`
    : null;

  return (
    <div className="h-full w-full bg-secondary rounded-2xl border border-border overflow-hidden flex flex-col shadow-xl transition-all duration-300 hover:shadow-2xl">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          3D Structure
        </h3>
        <div className="flex items-center gap-2">
          {activeProteinId && <span className="text-xs font-mono text-muted-foreground">{activeProteinId}</span>}
          <span className="px-2 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded text-xs">PDB</span>
        </div>
      </div>

      {/* 3D Content */}
      <div className="flex-1 relative bg-white">
        {viewerUrl ? (
          <>
            <iframe
              src={viewerUrl}
              className="w-full h-full border-0"
              title="3D Viewer"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
            {/* Removed Open in AlphaFold link as requested */}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 mb-4 animate-spin-slow" />
            <p>Search for a protein (e.g., <strong>TP53</strong>) to visualize its 3D structure.</p>
          </div>
        )}
      </div>
    </div >
  );
};

export default ProteinViewer;
