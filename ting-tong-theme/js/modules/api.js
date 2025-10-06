const mockSlides = [
  {
    id: "slide1",
    access: "public",
    initialLikes: 10,
    isLiked: false,
    initialComments: 4,
    isIframe: false,
    mp4Url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    user: "Filmik 1",
    description: "Podpis do filmiku 1",
    avatar: "https://i.pravatar.cc/100?u=1",
    likeId: "101",
    comments: [
      {
        id: "c1-1",
        parentId: null,
        user: "Kasia",
        avatar: "https://i.pravatar.cc/100?u=10",
        text: "Niesamowite ujęcie! 🐰",
        timestamp: "2023-10-27T10:00:00Z",
        likes: 15,
        isLiked: false,
        canEdit: true,
      },
      {
        id: "c1-1-1",
        parentId: "c1-1",
        user: "Tomek",
        avatar: "https://i.pravatar.cc/100?u=11",
        text: "Prawda!",
        timestamp: "2023-10-27T10:01:00Z",
        likes: 2,
        isLiked: false,
      },
      {
        id: "c1-2",
        parentId: null,
        user: "Tomek",
        avatar: "https://i.pravatar.cc/100?u=11",
        text: "Haha, co za królik!",
        timestamp: "2023-10-27T10:05:00Z",
        likes: 5,
        isLiked: true,
      },
      {
        id: "c1-3",
        parentId: null,
        user: "Anna",
        avatar: "https://i.pravatar.cc/100?u=13",
        text: "Super! ❤️",
        timestamp: "2023-10-27T10:10:00Z",
        likes: 25,
        isLiked: false,
      },
    ],
  },
  {
    id: "slide2",
    access: "secret",
    initialLikes: 20,
    isLiked: false,
    initialComments: 2,
    isIframe: false,
    mp4Url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    user: "Paweł Polutek",
    description: "Podpis do filmiku 2",
    avatar: "https://i.pravatar.cc/100?u=2",
    likeId: "102",
    comments: [
      {
        id: "c2-1",
        parentId: null,
        user: "Admin",
        avatar: "https://i.pravatar.cc/100?u=12",
        text: "To jest materiał premium!",
        timestamp: "2023-10-27T11:00:00Z",
        likes: 100,
        isLiked: true,
      },
      {
        id: "c2-2",
        parentId: null,
        user: "Ewa",
        avatar: "https://i.pravatar.cc/100?u=14",
        text: "Zgadzam się, świetna jakość.",
        timestamp: "2023-10-27T11:05:00Z",
        likes: 12,
        isLiked: false,
      },
    ],
  },
  {
    id: "slide3",
    access: "pwa",
    initialLikes: 30,
    isLiked: false,
    initialComments: 2,
    isIframe: false,
    mp4Url:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    user: "Test Video",
    description: "A test video slide.",
    avatar: "https://i.pravatar.cc/100?u=3",
    likeId: "103",
    comments: [
      {
        id: "c3-1",
        parentId: null,
        user: "Jan",
        avatar: "https://i.pravatar.cc/100?u=15",
        text: "Działa!",
        timestamp: "2023-10-27T12:00:00Z",
        likes: 0,
        isLiked: false,
      },
      {
        id: "c3-2",
        parentId: null,
        user: "Zofia",
        avatar: "https://i.pravatar.cc/100?u=16",
        text: "Testowy komentarz",
        timestamp: "2023-10-27T12:01:00Z",
        likes: 1,
        isLiked: false,
      },
    ],
  },
];

if (typeof window.TingTongData === "undefined") {
  console.warn(
    "`TingTongData` is not defined. Using mock data for standalone development.",
  );
  window.TingTongData = {
    isLoggedIn: false,
    slides: mockSlides,
  };
}

export const slidesData =
  typeof window.TingTongData !== "undefined" &&
  Array.isArray(window.TingTongData.slides) &&
  window.TingTongData.slides.length > 0
    ? window.TingTongData.slides
    : mockSlides;

slidesData.forEach((s) => {
  s.likeId = String(s.likeId);
});

async function _request(action, data = {}) {
  try {
    const body = new URLSearchParams({
      action,
      nonce: ajax_object.nonce,
      ...data,
    });
    const response = await fetch(ajax_object.ajax_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      credentials: "same-origin",
      body,
    });
    if (!response.ok)
      throw new Error(`Server responded with ${response.status}`);
    const json = await response.json();
    if (json.new_nonce) ajax_object.nonce = json.new_nonce;
    return json;
  } catch (error) {
    console.error(`API Client Error for action "${action}":`, error);
    return { success: false, data: { message: error.message } };
  }
}

function findCommentById(comments, commentId) {
  if (!comments || !commentId) return null;
  return comments.find((c) => c.id === commentId) || null;
}

export const API = {
  login: (data) => _request("tt_ajax_login", data),
  logout: () => _request("tt_ajax_logout"),
  toggleLike: (postId) => _request("toggle_like", { post_id: postId }),
  refreshNonce: async () => {
    const json = await _request("tt_refresh_nonce");
    if (json.success && json.nonce) ajax_object.nonce = json.nonce;
    else console.error("Failed to refresh nonce.", json);
  },
  fetchSlidesData: () => _request("tt_get_slides_data_ajax"),
  fetchComments: async (slideId) => {
    const response = await _request("tt_get_comments", {
      slide_id: slideId,
    });

    if (response.success) {
      return response;
    } else {
      // MOCK: Simulate API delay
      console.warn("AJAX tt_get_comments failed, using mock fallback.");
      await new Promise((resolve) => setTimeout(resolve, 300));
      const slide = slidesData.find((s) => s.id === slideId);
      if (slide && slide.comments) {
        return { success: true, data: slide.comments };
      }
      return { success: false, data: { message: "Comments not found." } };
    }
  },
  postComment: async (slideId, text, parentId = null) => {
    const response = await _request("tt_post_comment", {
      slide_id: slideId,
      text,
      parent_id: parentId,
    });

    if (response.success) {
      return response;
    } else {
      // MOCK FALLBACK
      console.warn("AJAX tt_post_comment failed, using mock fallback.");
      await new Promise((resolve) => setTimeout(resolve, 500));
      const slide = slidesData.find((s) => s.id === slideId);
      if (!slide) {
        return { success: false, data: { message: "Slide not found." } };
      }

      const newComment = {
        id: `c${slide.id}-${Date.now()}`,
        parentId: parentId,
        user: "Ja (Ty)", // Mocked user
        avatar: "https://i.pravatar.cc/100?u=99", // Mocked avatar
        text: text,
        timestamp: new Date().toISOString(),
        likes: 0,
        isLiked: false,
        canEdit: true,
      };

      slide.comments.push(newComment);
      slide.initialComments = slide.comments.length;

      return { success: true, data: newComment };
    }
  },
  editComment: async (slideId, commentId, newText) => {
    const response = await _request("tt_edit_comment", {
      slide_id: slideId,
      comment_id: commentId,
      text: newText,
    });

    if (response.success) {
      return response;
    } else {
      // MOCK FALLBACK
      console.warn("AJAX tt_edit_comment failed, using mock fallback.");
      await new Promise((resolve) => setTimeout(resolve, 300));
      const slide = slidesData.find((s) => s.id === slideId);
      if (!slide)
        return { success: false, data: { message: "Slide not found." } };
      const comment = findCommentById(slide.comments, commentId);
      if (!comment)
        return { success: false, data: { message: "Comment not found." } };

      comment.text = newText;
      return { success: true, data: comment };
    }
  },
  deleteComment: async (slideId, commentId) => {
    const response = await _request("tt_delete_comment", {
      slide_id: slideId,
      comment_id: commentId,
    });

    if (response.success) {
      return response;
    } else {
      // MOCK FALLBACK
      console.warn("AJAX tt_delete_comment failed, using mock fallback.");
      await new Promise((resolve) => setTimeout(resolve, 300));
      const slide = slidesData.find((s) => s.id === slideId);
      if (!slide)
        return { success: false, data: { message: "Slide not found." } };

      const commentIndex = slide.comments.findIndex(
        (c) => c.id === commentId,
      );
      if (commentIndex === -1)
        return { success: false, data: { message: "Comment not found." } };

      slide.comments.splice(commentIndex, 1);
      slide.initialComments = slide.comments.length;

      return { success: true };
    }
  },
  toggleCommentLike: async (slideId, commentId) => {
    const response = await _request("tt_toggle_comment_like", {
      slide_id: slideId,
      comment_id: commentId,
    });

    if (response.success) {
      return response;
    } else {
      // MOCK FALLBACK
      console.warn(
        "AJAX tt_toggle_comment_like failed, using mock fallback.",
      );
      await new Promise((resolve) => setTimeout(resolve, 200));
      const slide = slidesData.find((s) => s.id === slideId);
      if (!slide)
        return { success: false, data: { message: "Slide not found." } };

      const comment = findCommentById(slide.comments, commentId);
      if (!comment)
        return { success: false, data: { message: "Comment not found." } };

      comment.isLiked = !comment.isLiked;
      comment.likes += comment.isLiked ? 1 : -1;

      return {
        success: true,
        data: { isLiked: comment.isLiked, likes: comment.likes },
      };
    }
  },
};