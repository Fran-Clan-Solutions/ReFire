$(document).ready(function ()
{
    const params = new URLSearchParams(window.location.search);
    const ingredients = params.getAll("ingredient_list");

    $.ajax(
    {
        url: "/search",
        data:
        { 
            ingredient_list: ingredients
        },
        traditional: true,
        success: function (recipes)
        {
            let html = "";
            if (!recipes || recipes.length === 0)
            {
                html = "<p>No recipes found.</p>";
            }
            else
            {
                html = "<ul>";
                recipes.forEach(recipe =>
                {
                    html += `<li>
                        <strong>${recipe.name}</strong> (${recipe.mealType})<br>
                        Time: ${recipe.timeToMake} minutes<br>
                        Instructions: ${recipe.instructions}<br>
                        Ingredients: ${recipe.ingredients.join(", ")}
                    </li><br>`;
                });
                html += "</ul>";
            }
            $("#recipes_list").html(html);
        }
    });
});

function backToSearch()
{
    // Navigate to index.html with query params
    window.location.href = `index.html`;
}