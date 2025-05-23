import { useNostr } from "@/hooks/useNostr";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthor } from "@/hooks/useAuthor";
import { Users } from "lucide-react";
import { Link } from "react-router-dom";

interface ApprovedMembersListProps {
  communityId: string;
}

export function ApprovedMembersList({ communityId }: ApprovedMembersListProps) {
  const { nostr } = useNostr();
  
  // Query for approved members
  const { data: approvedMembersEvents, isLoading } = useQuery({
    queryKey: ["approved-members-list", communityId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      const events = await nostr.query([{ 
        kinds: [14550],
        "#a": [communityId],
        limit: 10,
      }], { signal });
      
      return events;
    },
    enabled: !!nostr && !!communityId,
  });

  // Extract all approved member pubkeys from the events
  const approvedMembers = approvedMembersEvents?.flatMap(event => 
    event.tags.filter(tag => tag[0] === "p").map(tag => tag[1])
  ) || [];

  // Remove duplicates
  const uniqueApprovedMembers = [...new Set(approvedMembers)];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Members ({uniqueApprovedMembers.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        ) : uniqueApprovedMembers.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <p>No approved members yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {uniqueApprovedMembers.slice(0, 10).map((pubkey) => (
              <MemberItem key={pubkey} pubkey={pubkey} />
            ))}
            {uniqueApprovedMembers.length > 10 && (
              <div className="text-center text-sm text-muted-foreground pt-2">
                + {uniqueApprovedMembers.length - 10} more members
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface MemberItemProps {
  pubkey: string;
}

function MemberItem({ pubkey }: MemberItemProps) {
  const author = useAuthor(pubkey);
  const metadata = author.data?.metadata;
  
  const displayName = metadata?.name || pubkey.slice(0, 8);
  const profileImage = metadata?.picture;
  
  return (
    <Link to={`/profile/${pubkey}`} className="flex items-center gap-3 hover:bg-muted p-2 rounded-md transition-colors">
      <Avatar>
        <AvatarImage src={profileImage} />
        <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <span className="font-medium">{displayName}</span>
    </Link>
  );
}