export const NotificationMessages = {
  LIKE_RECIPE: (username: string, recipeTitle: string) =>
    `${username} liked your recipe ${recipeTitle}`,
  NEW_COMMENT: (username: string, recipeTitle: string) =>
    `${username} commented on your recipe ${recipeTitle}`,
  NEW_FOLLOW: (username: string) => `${username} followed you`,
};
