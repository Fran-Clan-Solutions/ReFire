function addIngredient()
{
    var mIngredient = $("#ingredient_input").val();

    $.ajax
    ({
        url:"http://localhost:8080/addIngredient?ingredient=" + mIngredient,
        success: function(res) {
            var row_html_str = "<tr><td>" + res +"</td></tr>";
    
            if(res != "")
            {
                $("#ingredient_list").append(row_html_str);
                
                console.log(res + " appended");
            }
        }
    });
}

function search()
{
    console.log("Searching...");
    
    console.log($("#ingredient_list"));
}