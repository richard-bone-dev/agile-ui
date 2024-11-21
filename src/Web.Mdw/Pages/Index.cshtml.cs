using Application.Pages.Models;
using Application.Settings;
using Application.Tenants.Services;
using Domain.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Razor.Models;
using Razor.ViewModels.Pages;

namespace Web.Mdw.Pages;

public class IndexModel : LayoutModel
{
    private readonly IWebHostEnvironment _env;
    private readonly TenantSettings _options;

    public IndexModel(
        IRouteService routeService,
        ITenantService tenantService,
        IWebHostEnvironment env,
        IOptions<TenantSettings> options)
        : base(tenantService, routeService)
    {
        _env = env;
        _options = options.Value;
    }

    public override async Task<IActionResult> OnGetAsync(CancellationToken cancellationToken)
	{
        var pageKey = _routeService.GetPageKey();
        var siteKey = _routeService.GetSiteKey();

        var tenantId = _tenantService.GetTenantId();

        var tenant = TenantData.Create(_options);
        var page = tenant.Sites.First(x => x.Key == siteKey).Pages.First(x => x.Key == pageKey);

        PageViewModel = IndexPageViewModel.From(page);

		return PageViewModel == null ? NotFound() : Page();
	}
}