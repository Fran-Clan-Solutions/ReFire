function addIngredient()
{
    var mIngredient = $("#ingredient_input").val();

    $.ajax
    ({
        url:"http://localhost:8080/addIngredient?ingredient=" + mIngredient
    })
    .then(function(data)
    {
        $("#ingredient_list").text(data);
    });
}

function search()
{
    console.log("Searching...");
}