let mIngredient_list = []

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

// Trigger addIngredient() on Enter key press
$(document).ready(function() 
{
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

    // Remove from array
    mIngredient_list = mIngredient_list.filter(item => item !== ingredient);

    // Remove tag element
    $(this).parent().remove();

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
                
                    // Create tag with remove button
                    const badgeHTML = `
                        <span class='badge bg-secondary ingredient-badge'>
                            ${res}
                            <span class="ms-2 text-light remove-tag" style="cursor:pointer;" data-ingredient="${mIngredient}">&times;</span>
                        </span>
                    `;
                    $("#ingredient_list").append(badgeHTML);
                
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
    while (mIngredient_list.length > 0) 
    {
        mIngredient_list.pop();
    }    
    
    $(".ingredient-badge").remove();
    updateClearButtonVisibility();
}

function search() 
{
    const params = new URLSearchParams();
    mIngredient_list.forEach(i => params.append("ingredient_list", i));

    // Navigate to recipes.html with query params
    window.location.href = `recipes.html?${params.toString()}`;
}