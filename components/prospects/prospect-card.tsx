"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProspectMessageDialog } from "@/components/prospects/prospect-message-dialog";
import { Trash2 } from "lucide-react";
import type { Prospect } from "@/types/models";

export function ProspectCard({
  prospect,
  onChanged,
}: {
  prospect: Prospect;
  onChanged: () => void;
}) {
  const remove = async () => {
    await fetch(`/api/prospects/${prospect.id}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <Card>
      <CardContent className="space-y-2 py-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium">{prospect.name}</p>
            {prospect.company && (
              <p className="text-xs text-muted-foreground">{prospect.company}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" className="-mr-1 -mt-1 h-6 w-6 shrink-0" onClick={remove}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
        {(prospect.email || prospect.phone) && (
          <p className="text-xs text-muted-foreground">
            {[prospect.email, prospect.phone].filter(Boolean).join(" · ")}
          </p>
        )}
        {prospect.notes && <p className="text-xs text-muted-foreground">{prospect.notes}</p>}
        {prospect.channel && <Badge variant="secondary">{prospect.channel}</Badge>}
        <ProspectMessageDialog prospect={prospect} onChanged={onChanged} />
      </CardContent>
    </Card>
  );
}
