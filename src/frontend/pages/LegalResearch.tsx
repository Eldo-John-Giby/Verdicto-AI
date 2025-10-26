import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Calendar, MapPin } from "lucide-react";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function LegalResearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const cases = useQuery(api.cases.list, {});
  const searchResults = useQuery(
    api.cases.search,
    searchTerm.length > 2 ? { searchTerm } : "skip"
  );

  const displayCases = searchTerm.length > 2 ? searchResults : cases;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-light mb-2 text-foreground tracking-tight" style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, letterSpacing: '-0.02em' }}>Legal Research</h1>
        <p className="text-muted-foreground font-light" style={{ letterSpacing: '0.01em' }}>
          Search through our database of legal cases and precedents
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <Card className="glass-strong p-4 neon-glow">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search cases, keywords, or case numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 glass"
              />
            </div>
            <Button className="neon-glow">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* Results */}
      <div className="space-y-4">
        {displayCases?.map((caseItem: any, index: number) => (
          <motion.div
            key={caseItem._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="glass-strong p-6 hover:neon-glow transition-all cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-lg font-bold mb-1">{caseItem.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {caseItem.caseNumber}
                      </p>
                    </div>
                    <Badge variant="secondary">{caseItem.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {caseItem.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {caseItem.year}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {caseItem.jurisdiction}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {caseItem.tags.map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {displayCases?.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">No cases found</p>
        </motion.div>
      )}
    </div>
  );
}
