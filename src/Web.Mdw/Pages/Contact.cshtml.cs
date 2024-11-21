using Microsoft.AspNetCore.Mvc;
using Razor.Models;
using MimeKit;
using MimeKit.Utils;
using MailKit.Net.Smtp;
using System.Reflection;
using Application.Tenants.Services;
using Domain.Services;
using Razor.ViewModels.Pages;
using Application.Pages.Models;
using Application.Settings;
using Microsoft.Extensions.Options;

namespace Web.Mdw.Pages;

public class ContactModel : LayoutModel
{
    private readonly ILogger<ContactModel> _logger;
    private readonly IWebHostEnvironment _env;
    private readonly TenantSettings _options;

    public ContactModel(
        IRouteService routeService,
        ITenantService tenantService,
		ILogger<ContactModel> logger,
        IWebHostEnvironment env,
        IOptions<TenantSettings> options)
        : base(tenantService, routeService)
    {
        _logger = logger;
        _env = env;
		_options = options.Value;
    }

    [BindProperty]
    public ContactForm Form { get; set; }

    public override async Task<IActionResult> OnGetAsync(CancellationToken cancellationToken)
    {
        var pageKey = _routeService.GetPageKey();
        var siteKey = _routeService.GetSiteKey();

        var tenantId = _tenantService.GetTenantId();

        var tenant = TenantData.Create(_options);
		var site = tenant.Sites.First(x => x.Key == siteKey);
		
		var page = site.Pages.First(x => x.Key == pageKey);

        PageViewModel = ContactPageViewModel.From(page);

		return PageViewModel == null ? NotFound() : Page();
    }

    public async Task<IActionResult> OnPostHandleSubmitAsync(ContactForm form, List<IFormFile> attachments)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest("Form validation failed");
        }

        IsSuccess = true;
        SuccessMessage = "Thanks for getting in touch! Your message has been sent successfully. One of our trained specialists will respond within 24 hours, Monday to Friday.";

        try
        {
            SendEmailRequest(form);
            SendEmailResponse(form);
        }
        catch (Exception ex)
        {
            ModelState.AddModelError("", $"There was an error sending your message: {ex.Message}");
            IsSuccess = false;
        }

        return new JsonResult(new { success = true, message = "Form submitted successfully" });
    }

    public bool IsSuccess { get; set; } = false;
    public string SuccessMessage { get; set; }
    public string ErrorMessage { get; set; }
    public string ShortName { get; set; } = "Eot";


    private const string ToAddress = "bone.r28@hotmail.com";
    private const string PostMasterAddress = "erindontrack@gmail.com";
    private const string Password = "zfqdlatualcqrkrf";
    private const string Host = "smtp.gmail.com";
    private const int Port = 587;
    private const bool UseDefaultCredentials = false;
    private const bool EnableSSL = true;

	private string EmailRequest(ContactForm form)
	{
		return $@"
		       <!DOCTYPE html>
		       <html lang='en'>
		       <body style='font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0;'>
		           <div style='padding: 20px; background-color: #ffffff;'>
		               <div style='margin-top: 20px;'>
		                   <h2 style='color: #444;'>Erind onTrack Contact Form Submission</h2>
		                   <p style='color: #444;'><strong>From:</strong> " + form.Name + @"</p>
		                   <p style='color: #444;'><strong>Email:</strong> " + form.Email + @"</p>
		                   <p style='color: #444;'><strong>Phone:</strong> " + form.Phone + @"</p>
		                   <p style='color: #555;'><strong>Message:</strong> " + form.Message + @"</p>
		               </div>
		           </div>
		       </body>
		       </html>";
	}

	private string EmailResponse(ContactForm form)
	{
		return @"
			<!DOCTYPE html>
			<html lang='en'>
				<body style='font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0;'>
					<div style='padding: 20px; background-color: #ffffff;'>
						<div style='margin-top: 10px;'>
							<p style='color: #444;'>Thanks for getting in touch!</p>
							<p style='color: #444;'>We wanted to let you know that we have received your email and you can expect our of trained specialists to respond within 24 hours, Monday to Friday.</p>
							<p style='color: #444;'>Thank you so much for your patience.</p>
							<p style='color: #444;'>With Gratitude,</p>
							<p style='color: #444;'>&nbsp;</p>
						</div>
					</div>

					<table cellspacing=""0"" cellpadding=""0"" border=""0"" style=""FONT-FAMILY: Arial, sans-serif; COLOR: #f75932;width:380px;background: transparent !important;""><tbody><tr><td valign=""top"" style=""FONT-FAMILY: Arial, sans-serif;""> <p style=""border-bottom:1px solid #f75932;""> <span style=""FONT-SIZE: 16px; COLOR: #444444; FONT-FAMILY: Arial, sans-serif;""><strong>Erind onTrack</strong></span> <span style=""letter-spacing:-1px; FONT-SIZE: 15px; COLOR: #444444;""> | Professional Curtain &amp; Blind Fitters</span> </p> <span style=""white-space: nowrap;""><span style=""FONT-SIZE: 12px; color:#444444;""><img border=""0"" height=""15"" width=""14"" style=""border:0; height:15px; width:14px"" src=""https://www.mail-signatures.com/signature-generator/img/templates/compact-with-large-logo/phone-icon.png"">&nbsp; 0207 112 7588</span></span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style=""white-space: nowrap;""><span style=""FONT-SIZE: 12px;color:#444444;""><img border=""0"" height=""13"" width=""13"" style=""border:0; height:13px; width:13px"" src=""https://www.mail-signatures.com/signature-generator/img/templates/compact-with-large-logo/email-icon.png"">&nbsp; <a href=""mailto:erindontrack@gmail.com"" target=""_blank"" rel=""noopener"" style="" text-decoration:none;""><span style=""color:#444444; font-family:Arial, sans-serif; font-size:12px"">erindontrack@gmail.com</span></a></span><span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<br/><span style=""display: inline-block""><img border=""0"" height=""13"" width=""14"" style=""border:0; height:13px; width:14px"" src=""https://www.mail-signatures.com/signature-generator/img/templates/compact-with-large-logo/website-icon.png"">&nbsp; <a href=""http://erindontrack.com"" target=""_blank"" rel=""noopener"" style="" text-decoration:none;""><span style=""color:#444444; font-family:Arial, sans-serif; font-size:12px"">erindontrack.com</span></a></span></span> </span> <span style=""FONT-SIZE: 12px; color:#444444;""> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <img border=""0"" width=""15"" height=""13"" style=""border:0;width:15px;height:13px; "" src=""https://www.mail-signatures.com/signature-generator/img/templates/compact-with-large-logo/address-icon.png"">&nbsp; <span>West Molesey<span>,</span></span> Surrey<br></span></td></tr></tbody></table>

				</body>
			</html>";
	}

	private void SendEmailResponse(ContactForm form)
    {
        try
        {
			using (MimeMessage message = new MimeMessage())
			{
				message.From.Add(new MailboxAddress("Erind onTrack", PostMasterAddress));
				message.To.Add(new MailboxAddress(Form.Name, Form.Email));
				message.Subject = $"We have received your email. Re: {Form.Subject}";

				BodyBuilder builder = new BodyBuilder();

				builder.HtmlBody = EmailResponse(form);

				message.Body = builder.ToMessageBody();

				using (SmtpClient smtp = new SmtpClient())
				{
					smtp.Connect(Host, Port);
					smtp.Authenticate(PostMasterAddress, Password);
					smtp.Send(message);
					smtp.Disconnect(true);
				}
			}
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, ex.Message);
		}

	}

	private void SendEmailRequest(ContactForm form)
	{
		try
		{
			using (MimeMessage message = new MimeMessage())
			{
				message.From.Add(new MailboxAddress(Form.Name, Form.Email));
				message.To.Add(new MailboxAddress("Erind onTrack", PostMasterAddress));
				message.Bcc.Add(new MailboxAddress("IT", ToAddress));
				message.Subject = "New Contact Form Submission";

				BodyBuilder builder = new BodyBuilder();

				var path = @"/images/logo.png";
				
				var file = new FileInfo(path);

				if (file.Exists)
				{
                    using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("logo.png"))
                    {
                        var image = builder.LinkedResources.Add("logo.png", stream);
                        image.ContentId = MimeUtils.GenerateMessageId();

                        builder.HtmlBody = EmailRequest(form);
                    }
                }
                else
                {
                    builder.HtmlBody = EmailRequest(form);
                }

                if (form.Attachments != null && form.Attachments.Count > 0)
				{
					foreach (var attachment in form.Attachments)
					{
						string fileName = Path.GetFileName(attachment.FileName);
						builder.Attachments.Add(fileName, attachment.OpenReadStream());
					}
				}

				message.Body = builder.ToMessageBody();

				using (SmtpClient smtp = new SmtpClient())
				{
					smtp.Connect(Host, Port);
					smtp.Authenticate(PostMasterAddress, Password);
					smtp.Send(message);
					smtp.Disconnect(true);
				}
			}
		}
		catch (Exception ex)
		{
			_logger.LogError(ex, ex.Message);
		}
	}
}


//public async Task<IActionResult> OnPostAsync()
//{
//    if (ModelState.IsValid || ModelState.ErrorCount == 1)
//    {
//        IsSuccess = true;
//        SuccessMessage = "Thanks for getting in touch! Your message has been sent successfully. One of our trained specialists will respond within 24 hours, Monday to Friday.";

//        try
//        {
//            SendEmailRequest(Form);
//            SendEmailResponse(Form);
//        }
//        catch (Exception ex)
//        {
//            ModelState.AddModelError("", $"There was an error sending your message: {ex.Message}");
//            IsSuccess = false;
//        }
//    }

//    var pageKey = _routeService.GetPageKey();
//    var siteKey = _routeService.GetSiteKey();

//    var tenantId = _tenantService.GetTenantId();

//    var tenant = await _siteDefinitionManager.LoadSiteDefinitionAsync(SiteKey.Eot);
//    var result = await _siteDefinitionManager.LoadPageDefinitionAsync(SiteKey.Eot, PageKey.Contact);

//    PageViewModel = ContactPageViewModel.From(result);

//    return Page();
//}