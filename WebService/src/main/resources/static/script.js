let mIngredient_list = []

// Escapes HTML special characters so user-typed ingredient text can never
// be interpreted as markup/script when inserted into the page.
function escapeHtml(str) 
{
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Renders the ingredient tags from mIngredient_list. Single source of truth
// for what's on screen, used both when restoring ingredients (e.g. coming
// back from the recipes page) and when adding a new one.
function renderIngredientTags() 
{
    const tagHTML = mIngredient_list.map(i => `
        <span class='badge bg-secondary ingredient-badge me-2 mb-2'>
            ${escapeHtml(i)}
            <span class="ms-2 text-light remove-tag" style="cursor:pointer;" data-ingredient="${escapeHtml(i)}">&times;</span>
        </span>
    `).join("");
    $("#ingredient_list").html(tagHTML);
}

function updateClearButtonVisibility() 
{
    if (mIngredient_list.length > 0) 
    {
        $("#ingredient_header").show();
        $("#clear_button_container").show();
    } 
    else 
    {
        $("#ingredient_header").hide();
        $("#clear_button_container").hide();
    }
}

// Restore any ingredients carried back from the recipes page (via "Back to
// Search"), then wire up the Enter-to-add behavior.
$(document).ready(function() 
{
    const params = new URLSearchParams(window.location.search);
    params.getAll("ingredient_list").forEach(i => 
    {
        const lower = i.toLowerCase();
        if (lower && !mIngredient_list.includes(lower)) 
        {
            mIngredient_list.push(lower);
        }
    });
    renderIngredientTags();
    updateClearButtonVisibility();

    $("#ingredient_input").on("keydown", function(e) 
    {
        if (e.key === "Enter") 
        {
            e.preventDefault(); // stop form from submitting
            addIngredient();
        }
    });
});

// Remove individual tag when X is clicked
$(document).on("click", ".remove-tag", function() 
{
    const ingredient = $(this).data("ingredient");

    // Remove from array and re-render so the DOM always matches mIngredient_list
    mIngredient_list = mIngredient_list.filter(item => item !== ingredient);
    renderIngredientTags();

    updateClearButtonVisibility();
});

function addIngredient() 
{
    var mIngredient = $("#ingredient_input").val().trim().toLowerCase();

    if (!mIngredient) return; // ignore empty input

    $.ajax(
    {
        url: "/addIngredient?ingredient=" + encodeURIComponent(mIngredient),
        success: function(res) 
        {
            if (res !== "") 
            {
                // Add tag
                if (!mIngredient_list.includes(mIngredient))
                {
                    mIngredient_list.push(mIngredient);
                    renderIngredientTags();

                    $("#ingredient_input").val(""); // clear input
                    console.log(res + " appended");
                    updateClearButtonVisibility();
                }
            }
        }
    });
}

function clearIngredients()
{
    mIngredient_list = [];
    renderIngredientTags();
    updateClearButtonVisibility();
}

function search() 
{
    const params = new URLSearchParams();
    mIngredient_list.forEach(i => params.append("ingredient_list", i));

    // Navigate to recipes.html with query params
    window.location.href = `recipes.html?${params.toString()}`;
}