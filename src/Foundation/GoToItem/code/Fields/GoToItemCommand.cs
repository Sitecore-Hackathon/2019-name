using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using System;
using Sitecore;

namespace DollarName.Foundation.GoToItem.Fields
{
    [Serializable]
    public class GoToItemCommand : Command
    {
        public override void Execute(CommandContext context)
        {
            ClientPipelineArgs args = new ClientPipelineArgs();
            string fieldId = context.Parameters["id"];
            args.Parameters["id"] = Sitecore.Context.ClientPage.ClientRequest.Form[fieldId];
            Context.ClientPage.Start(this, "Run", args);
        }

        protected void Run(ClientPipelineArgs args)
        {
            if (!args.IsPostBack)
            {
                string id = args.Parameters["id"];

                //string controlUrl = Sitecore.UIUtil.GetUri("contentlink:followlinkcommand");
                //UrlString urlStr = new UrlString(controlUrl);
                //urlStr.Append("id", id);

                Context.ClientPage.SendMessage(this, string.Format("item:load(id={0})", id));

            }

        }
    }
}
