import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Boxes,
  FlaskConical,
  Star,
  ExternalLink,
  Dna,
  AlertTriangle,
  Pill,
  Network,
  Loader2,
} from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { userApi, apiErrorMessage } from "@/lib/api";

type Tab = "structure" | "details";

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Dna;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
      <Icon className="w-3.5 h-3.5" />
      {title}
    </div>
    {children}
  </div>
);

const ProteinViewer = () => {
  const protein = useChatStore((s) => s.activeProtein);
  const [tab, setTab] = useState<Tab>("structure");
  const [savingFav, setSavingFav] = useState(false);

  const viewerUrl = useMemo(() => {
    if (!protein?.structure?.url) return null;
    const p = new URLSearchParams({
      url: protein.structure.url,
      format: protein.structure.format || "pdb",
      label: protein.structure.id || protein.accession,
    });
    return `/molstar.html?${p.toString()}`;
  }, [protein]);

  const saveFavorite = async () => {
    if (!protein) return;
    setSavingFav(true);
    try {
      await userApi.addFavorite({
        accession: protein.accession,
        name: protein.name,
        gene: protein.gene || undefined,
        organism: protein.organism || undefined,
      });
      toast.success(`Saved ${protein.gene || protein.accession} to favorites`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not save favorite"));
    } finally {
      setSavingFav(false);
    }
  };

  if (!protein) {
    return (
      <div className="h-full w-full rounded-2xl border border-border bg-secondary/40 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
        <div className="w-12 h-12 rounded-full border-2 border-dashed border-muted-foreground/30 mb-4 animate-[spin-slow_18s_linear_infinite]" />
        <p className="text-sm max-w-[220px]">
          Search a gene or protein to load its 3D structure and research dossier.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full rounded-2xl border border-border bg-card overflow-hidden flex flex-col shadow-soft">
      {/* header */}
      <div className="px-4 pt-3 pb-0 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate">{protein.name}</h3>
            <p className="text-xs text-muted-foreground truncate">
              {protein.gene ? `${protein.gene} · ` : ""}
              {protein.organism} · {protein.accession}
            </p>
          </div>
          <button
            onClick={saveFavorite}
            disabled={savingFav}
            className="shrink-0 inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-border hover:bg-accent transition-colors"
          >
            {savingFav ? <Loader2 className="w-3 h-3 animate-spin" /> : <Star className="w-3 h-3" />}
            Save
          </button>
        </div>

        <div className="flex gap-1 mt-3">
          {(["structure", "details"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-brand text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "structure" ? "3D Structure" : "Details"}
            </button>
          ))}
        </div>
      </div>

      {/* body */}
      {tab === "structure" ? (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 relative bg-white">
            {viewerUrl ? (
              <iframe
                key={viewerUrl}
                src={viewerUrl}
                title="3D structure"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground text-sm p-6 text-center">
                <AlertTriangle className="w-5 h-5 mb-2" />
                No 3D model resolved for this entry.
              </div>
            )}
          </div>
          <div className="px-4 py-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {protein.structure.source === "pdb"
                ? `Experimental · PDB ${protein.structure.id}`
                : protein.structure.source === "alphafold"
                ? `Predicted · AlphaFold ${protein.structure.id}`
                : "No structure"}
            </span>
            {protein.structure.url && (
              <a
                href={protein.structure.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                coordinates <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5 text-sm">
          {protein.function && (
            <Section icon={FlaskConical} title="Function">
              <p className="text-muted-foreground leading-relaxed">{protein.function}</p>
            </Section>
          )}

          {protein.diseases.length > 0 && (
            <Section icon={AlertTriangle} title={`Disease associations (${protein.diseases.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {protein.diseases.map((d) => (
                  <span
                    key={d.id}
                    title={d.description || undefined}
                    className="px-2 py-0.5 rounded-md bg-secondary text-xs"
                  >
                    {d.id}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {protein.drugs.length > 0 && (
            <Section icon={Pill} title={`Known drugs (${protein.drugs.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {protein.drugs.slice(0, 24).map((d) => (
                  <span key={d.id} className="px-2 py-0.5 rounded-md bg-secondary text-xs">
                    {d.name}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {protein.interactions.length > 0 && (
            <Section icon={Network} title={`Interaction partners (${protein.interactions.length})`}>
              <div className="flex flex-wrap gap-1.5">
                {protein.interactions.map((i) => (
                  <span
                    key={`${i.partner}-${i.source}`}
                    className="px-2 py-0.5 rounded-md border border-border text-xs"
                  >
                    {i.partner}
                  </span>
                ))}
              </div>
            </Section>
          )}

          {protein.sequence && (
            <Section icon={Dna} title={`Sequence (${protein.length} aa)`}>
              <p className="font-mono text-[10px] leading-relaxed break-all text-muted-foreground max-h-32 overflow-y-auto custom-scrollbar">
                {protein.sequence}
              </p>
            </Section>
          )}

          <div className="pt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Boxes className="w-3 h-3" />
            Sources: {protein.sources.join(", ")}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProteinViewer;
