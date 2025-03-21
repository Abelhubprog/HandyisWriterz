import React from "react";
import { MessageSquare, User, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  postTitle: string;
  postId: string;
  createdAt: string;
  status: "pending" | "approved" | "spam";
}

export const RecentComments: React.FC = () => {
  const navigate = useNavigate();
  const [comments, setComments] = React.useState<Comment[]>([]);

  React.useEffect(() => {
    // TODO: Fetch real comments from API
    setComments([
      {
        id: "1",
        author: {
          name: "Sarah Johnson",
          avatar: "https://ui-avatars.com/api/?name=Sarah+Johnson"
        },
        content: "This guide was incredibly helpful for my nursing practice...",
        postTitle: "Introduction to Nursing Ethics",
        postId: "1",
        createdAt: "2025-03-09T14:23:00Z",
        status: "pending"
      },
      {
        id: "2",
        author: {
          name: "Michael Chen",
          avatar: "https://ui-avatars.com/api/?name=Michael+Chen"
        },
        content: "Could you elaborate more on the assessment techniques...",
        postTitle: "Mental Health Assessment Guide",
        postId: "3",
        createdAt: "2025-03-09T13:15:00Z",
        status: "pending"
      },
      {
        id: "3",
        author: {
          name: "Emily Brown",
          avatar: "https://ui-avatars.com/api/?name=Emily+Brown"
        },
        content: "The case studies really helped me understand...",
        postTitle: "Advanced Child Care Techniques",
        postId: "2",
        createdAt: "2025-03-09T12:45:00Z",
        status: "approved"
      }
    ]);
  }, []);

  const getStatusColor = (status: Comment["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "spam":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Comments</h2>
          <div className="h-7 w-7 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
            <MessageSquare size={14} />
          </div>
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {comments.map((comment) => (
          <div key={comment.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex gap-4">
              <img
                src={comment.author.avatar}
                alt=""
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {comment.author.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(comment.status)}`}>
                      {comment.status}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDate(comment.createdAt)}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                  {comment.content}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/admin/content/posts/${comment.postId}`)}
                    className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    <ExternalLink size={14} />
                    <span>{comment.postTitle}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 border-t border-gray-100">
        <button
          onClick={() => navigate("/admin/content/comments")}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          View all comments →
        </button>
      </div>
    </div>
  );
};
