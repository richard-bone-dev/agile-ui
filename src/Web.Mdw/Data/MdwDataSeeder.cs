using Application.Settings;
using Domain.Aggregates;
using Domain.Constants;
using Domain.Entities.Core;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Mdw.Data
{
    public class MdwDataSeeder : IMdwDataSeeder
    {
        private readonly ApplicationDbContext _context;
        private readonly EntityTenant _tenantConfig;
        private readonly IConfiguration _configuration;
        //private readonly ISiteFactory _siteFactory;
        private readonly ITenantSettings _tenantSettings;

        public MdwDataSeeder(
            ApplicationDbContext context,
            IOptions<EntityTenant> tenantConfig,
            IConfiguration configuration)
        {
            _context = context;
            _tenantConfig = tenantConfig.Value;
            _configuration = configuration;
            //_siteFactory = siteFactory;
        }

        public async Task SeedAsync()
        {
            if (await _context.EntityTenants.AnyAsync())
                return;

            // Map Tenant DTO to TenantAggregate
            var tenantAggregate = new EntityTenant(_tenantConfig.Name, _tenantConfig.ShortName);

            //foreach (var siteDto in _tenantConfig.Sites)
            //{
            //    // Use factory to create site aggregate with nested pages
            //    var siteAggregate = _siteFactory.From(siteDto, tenantAggregate.Id);
            //    tenantAggregate.AddSite(siteAggregate);
            //}

            _context.EntityTenants.Add(tenantAggregate);
            await _context.SaveChangesAsync();
        }

        public bool SeedStorageData()
        {
            //_configuration.GetSection(TenantSettings.BusinessInfo).Bind(_tenantSettings);

            var tenant = new EntityTenantAggregate("MD Wigmore", SiteKey.Mdw);
            var site = new EntitySiteAggregate("MD Wigmore", SiteKey.Mdw, tenant.Id);

            // TODO: What about all other site properties?
            tenant.AddSite(site.Name, site.Key);

            var page = new EntityPageAggregate(PageKey.Index, site.Id);
            site.AddPage(page.Key);

            //var page = new EntityPageAggregate(PageKey.Index,  .)
            //var tenant = new IndexPageAggregate
            //var tenant = GetOrCreateTenant(_tenantSettings);

            //var site = AddOrUpdateSite(tenant);

            return _context.SaveChanges() == 1;
        }

        private EntitySite AddOrUpdatePage(EntitySite site)
        {
            //var page = _siteFactory.Build(_tenantSettings);

            var entitySite = _context.Entities.OfType<EntitySite>().FirstOrDefault(x => x.ShortName == _tenantSettings.ShortName);

            //if (entitySite == null)
            //    entitySite = _siteFactory.To(site) as EntitySite;

            //tenant.Sites.Add(entitySite);

            //_context.Set<EntitySite>().Add(entitySite);
            var rowsAffected = _context.SaveChanges();

            return entitySite;
        }

        private EntitySite AddOrUpdateSite(EntityTenant tenant)
        {
            //SiteDto site = _siteFactory.Build(_tenantSettings);

            var entitySite = _context.Entities.OfType<EntitySite>().FirstOrDefault(x => x.ShortName == _tenantSettings.ShortName);

            //if (entitySite == null)
            //    entitySite = _siteFactory.To(site) as EntitySite;

            //tenant.AddSite(entitySite);

            //_context.Set<EntitySite>().Add(entitySite);
            var rowsAffected = _context.SaveChanges();

            return entitySite;
        }

        private void SaveSite(EntitySite site)
        {
            _context.Set<EntitySite>().Add(site);
            _context.SaveChanges();
        }

        private EntityTenant GetOrCreateTenant(ITenantSettings tenant)
        {
            var entityTenant = _context.EntityTenants.FirstOrDefault(x => x.ShortName == tenant.ShortName);

            if (entityTenant != null)
            {
                return entityTenant;
            }

            _context.Set<EntityTenant>().Add(new EntityTenant(tenant.Name, tenant.ShortName));

            var tenantId = _context.SaveChanges();

            return _context.EntityTenants.FirstOrDefault(x => x.Id == tenantId);
        }

        private EntityTenant GetTenantById(EntityTenant newTenant)
        {
            return _context.EntityTenants.First(x => x.Id == newTenant.Id);
        }

        private static EntityTenant CreateTenant(ITenantSettings tenant)
        {   
            return new EntityTenant(tenant.Name, tenant.ShortName);
        }
    }

    public interface IMdwDataSeeder
    {
        bool SeedStorageData();
    }
}

/*
    var nextTenantId = GetNewTenantId() + 1;
    var newTenant = GetNewTenant(nextTenantId);
    var context = new Dictionary<string, object> { { "TenantId", nextTenantId } };
 */

//public void SeedStorageData(TenantSettings tenant)
//{
//    if (_context.EntityTenants.Any(x => x.ShortName == tenant.ShortName)) return;

//    var tenant = CreateTenant(tenant);

//    //var site = tenant
//    //    .AddSite(tenant)
//    //    .AddSiteLinks(tenant);

//    //var homePage = site
//    //    .AddPage(PageKey.Index, RouteValue.Index)
//    //    .AddLayout(LayoutKey.ParallaxSliderLayout);

//    //var aboutUs = homePage.AddAboutUs(tenant);
//    //var chooseUs = homePage.AddChooseUs(tenant);

//    //var sliderFolders = Directory.GetDirectories(Path.Combine(_env.WebRootPath, DirectoryKey.HomeSlider));

//    //var slider = homePage.CreateSlider(_context)
//    //    .AddSlides(tenant, _env.WebRootPath, sliderFolders);

//    //var contactPage = site
//    //    .AddPage(PageKey.Contact, RouteValue.Contact)
//    //    .AddLayout(LayoutKey.ParallaxSliderLayout)
//    //    .AddContactPageTitle(PageKey.Contact, tenant);


//    //_context.Set<EntityTenant>().Add(tenant);
//    //_context.Set<EntitySite>().Add(site);
//    //_context.Set<EntityPage>().Add(homePage);
//    //_context.Set<EntityComponent>().Add(slider);
//    //_context.Set<EntityComponent>().Add(aboutUs);
//    //_context.Set<EntityComponent>().Add(chooseUs);

//    //_context.SaveChanges();
//}

//public class DataSeeder
//{
//    private readonly ApplicationDbContext _context;
//    private readonly EntityTenant _tenantConfig;
//    private readonly IEntitySiteAggregateFactory _siteFactory;
//    private readonly IEntityPageAggregateFactory _pageFactory;

//    public DataSeeder(
//        ApplicationDbContext context,
//        IOptions<EntityTenant> tenantConfig,
//        IEntitySiteAggregateFactory siteFactory,
//        IEntityPageAggregateFactory pageFactory)
//    {
//        _context = context;
//        _tenantConfig = tenantConfig.Value;
//        _siteFactory = siteFactory;
//        _pageFactory = pageFactory;
//    }

//    public async Task SeedAsync()
//    {
//        if (await _context.EntityTenants.AnyAsync())
//            return; // Exit if data already exists

//        // Create Tenant Aggregate from EntityTenant
//        var tenantAggregate = new EntityTenantAggregate(_tenantConfig.Name, _tenantConfig.ShortName);

//        foreach (var siteEntity in _tenantConfig.Sites)
//        {
//            // Use site factory to create EntitySiteAggregate from EntitySite
//            var siteAggregate = _siteFactory.From(siteEntity, tenantAggregate.Id);

//            // Add site to tenant aggregate
//            tenantAggregate.AddSite(siteAggregate.Name, siteAggregate.Key);
//        }

//        // Add tenant aggregate to DbContext and save changes
//        _context.EntityTenants.Add(tenantAggregate);
//        await _context.SaveChangesAsync();
//    }
//}