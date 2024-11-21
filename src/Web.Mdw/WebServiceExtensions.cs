using Application.Definitions;
using Application.Services;
using Application.Tenants.Services;
using Domain.Services;
using Infrastructure.Persistence;
using Infrastructure.Services;
using Microsoft.AspNetCore.Identity;

namespace Mdw
{
    public static class WebServiceExtensions
    {
        public static void AddConfiguration(this IServiceCollection services, WebApplicationBuilder builder)
        {
            builder.Configuration
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
                .AddJsonFile("Configurations/AboutUsViewComponent.json", optional: true, reloadOnChange: true)
                .AddJsonFile("Configurations/ChooseUsViewComponent.json", optional: true, reloadOnChange: true)
                .AddJsonFile("Configurations/IntroductionViewComponent.json", optional: true, reloadOnChange: true)
                .AddJsonFile("Configurations/MainNavBarViewComponent.json", optional: true, reloadOnChange: true)
				.AddJsonFile("Configurations/NavigationViewComponent.json", optional: true, reloadOnChange: true)
                .AddJsonFile("Configurations/NewsletterViewComponent.json", optional: true, reloadOnChange: true)
                .AddJsonFile("Configurations/PageTitleViewComponent.json", optional: true, reloadOnChange: true)
                .AddJsonFile("Configurations/ServicesViewComponent.json", optional: true, reloadOnChange: true)
				.AddJsonFile("Configurations/SuppliersViewComponent.json", optional: true, reloadOnChange: true)
                .AddEnvironmentVariables();
        }
        public static void AddWebServices(this IServiceCollection services, IConfiguration configuration)
		{
			services.AddScoped<ILayoutManager, LayoutManager>();
			services.AddDatabaseDeveloperPageExceptionFilter();

			services.AddDefaultIdentity<IdentityUser>(options => options.SignIn.RequireConfirmedAccount = true)
				.AddEntityFrameworkStores<ApplicationDbContext>();
		}

		public static void AddHttpClientServices(this IServiceCollection services, IConfiguration configuration)
		{
			services.AddHttpClient<IPageDataService, PageDataService>(client =>
			{
				var baseUri = configuration["BaseUrl"]!;

				client.BaseAddress = new Uri(baseUri);
			});
		}
		public static void AddSiteDefinitionServices(this IServiceCollection services, IConfiguration configuration)
		{
			services.AddTransient<IJsonFileResolver, JsonFileResolver>();
			//services.AddTransient<ISiteDefinitionManager, SiteDefinitionManager>();
			services.Configure<SiteDefinitions>(configuration.GetSection("SiteDefinitions"));
			services.AddOptions<SiteDefinitions>()
				.Bind(configuration.GetSection("SiteDefinitions"))
				.ValidateDataAnnotations()
				//.Validate(OnValidateSiteDefinitions)
				.ValidateOnStart();
		}

		private static bool OnValidateSiteDefinitions(SiteDefinitions options)
		{
			if (!Directory.Exists(options.BasePath))
			{
				Console.WriteLine($"Error: The directory '{options.BasePath}' does not exist.");
				return false;
			}
			return true;
		}
	}
}