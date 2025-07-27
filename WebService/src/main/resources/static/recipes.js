let allRecipes = [];

$(document).ready(function ()
{
    const params = new URLSearchParams(window.location.search);
    const ingredients = params.getAll("ingredient_list");

    // Fetch recipes once
    $.ajax({
        url: "/search",
        data:
        { 
            ingredient_list: ingredients
        },
        traditional: true,
        success: function (recipes)
        {
            allRecipes = recipes || [];
            renderRecipes(); // initial render
        }
    });

    // Listen for changes on any meal filter checkbox
    $('.meal-filter').on('change', function ()
    {
        renderRecipes(); // re-render on filter change
    });
});

function renderRecipes()
{
    const selectedFilters = $('.meal-filter:checked')
        .map(function () { return this.value.toUpperCase(); })
        .get();

    let filteredRecipes = allRecipes;

    if (selectedFilters.length > 0)
    {
        filteredRecipes = allRecipes.filter(recipe =>
            selectedFilters.includes(recipe.mealType.toUpperCase()));
    }

    let html = "";

    if (filteredRecipes.length === 0)
    {
        html = "<p>No recipes found.</p>";
    }
    else
    {
        html = "<ul>";
        filteredRecipes.forEach(recipe =>
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

function backToSearch()
{
    window.location.href = `index.html`;
}
