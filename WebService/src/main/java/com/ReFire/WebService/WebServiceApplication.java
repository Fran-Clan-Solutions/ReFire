package com.ReFire.WebService;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@SpringBootApplication
@RestController
public class WebServiceApplication
{
    public static void main(String[] args) 
    {
      SpringApplication.run(WebServiceApplication.class, args);
    }
    
    @GetMapping("/search")
    public String search(@RequestParam(value = "ingredient", defaultValue = "") String ingredient)
    {
    	return String.format("Searching for recipes with the following ingredients: %s", ingredient);
    }
}