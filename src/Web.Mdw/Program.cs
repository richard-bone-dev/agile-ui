using Mdw;
using Application;
using Infrastructure;
using Razor;
using Application.Settings;
using Mdw.Data;
using Razor.Components;

public class Program
{
    private static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions()
        {
            Args = args,
            ContentRootPath = Directory.GetCurrentDirectory()
        });

        var configuration = builder.Configuration;

        builder.Services.AddConfiguration(builder);
        builder.Services.AddHttpContextAccessor();
        builder.Services.AddRazorPages();
        builder.Services.AddSiteDefinitionServices(builder.Configuration);
        builder.Services.AddHttpClientServices(builder.Configuration);

        builder.Services.AddInfrastructureServices(configuration);
        builder.Services.AddDomainServices();
        builder.Services.AddApplicationServices();
        builder.Services.AddRazorServices();
        builder.Services.AddWebServices(configuration);

        builder.Services.AddScoped<IMdwDataSeeder, MdwDataSeeder>();

        builder.Services.Configure<TenantSettings>(configuration.GetSection("TenantSettings"));

        builder.Services.Configure<AboutUsOptions>(builder.Configuration.GetSection("AboutUsOptions"));
        builder.Services.Configure<ChooseUsOptions>(builder.Configuration.GetSection("ChooseUsOptions"));
        builder.Services.Configure<IntroductionOptions>(builder.Configuration.GetSection("IntroductionOptions"));
		builder.Services.Configure<MainNavBarOptions>(builder.Configuration.GetSection("MainNavBarOptions"));
		builder.Services.Configure<NavigationOptions>(builder.Configuration.GetSection("NavigationOptions"));
        builder.Services.Configure<NewsletterOptions>(builder.Configuration.GetSection("NewsletterOptions"));
        builder.Services.Configure<Dictionary<string, PageTitleOptions>>(builder.Configuration.GetSection("PageTitleOptions"));
        builder.Services.Configure<ServicesOptions>(builder.Configuration.GetSection("ServicesOptions"));
        builder.Services.Configure<SuppliersOptions>(builder.Configuration.GetSection("SupplierOptions"));

        builder.Logging.AddConsole();

        var app = builder.Build();

        using IServiceScope scope = ExecuteSetupPlans(app, configuration, true);

        app.UseDeveloperExceptionPage();

        if (app.Environment.IsDevelopment())
        {
            //app.UseMigrationsEndPoint();
        }
        else
        {
            app.UseExceptionHandler(new ExceptionHandlerOptions()
            {
                ExceptionHandlingPath = "/error"
            });

            app.UseHsts();
        }

        app.UseHttpsRedirection();
        app.UseStaticFiles();

        app.UseRouting();

        app.UseAuthorization();

        app.MapRazorPages();

        app.Run();

        static IServiceScope ExecuteSetupPlans(WebApplication app, ConfigurationManager configuration, bool runSetup = false)
        {
            var scope = app.Services.CreateScope();

            if (runSetup)
            {
                var dataSeeder = scope.ServiceProvider.GetRequiredService<IMdwDataSeeder>();
                //dataSeeder.SeedStorageData();
            }

            return scope;
        }
    }
}