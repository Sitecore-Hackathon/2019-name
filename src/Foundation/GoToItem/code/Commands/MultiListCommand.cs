using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using System;
using Sitecore;
using Sitecore.Diagnostics;

namespace DollarName.Foundation.GoToItem.Commands
{
    //Supports both Multilist and Multilist with Search
    [Serializable]
    public class MultiListCommand : Command
    {
        public override void Execute(CommandContext context)
        {
            Assert.ArgumentNotNull(context, nameof(context));

            string fieldId = context.Parameters["id"] ?? "";

            //get the ID of the selected item in the link type field
            var id = Sitecore.Context.ClientPage.ClientRequest.Form[fieldId + "_Selected"];

            ClientPipelineArgs args = new ClientPipelineArgs();
            args.Parameters["id"] = id;

            Context.ClientPage.Start(this, "Run", args);
        }

        //takes in an ID thru args and focuses the Content Tree on the item with that ID
        protected void Run(ClientPipelineArgs args)
        {
            Assert.ArgumentNotNull(args, nameof(args));

            if (!args.IsPostBack && !string.IsNullOrEmpty(args.Parameters["id"]))
            {
                string id = args.Parameters["id"];

                Context.ClientPage.SendMessage(this, string.Format("item:load(id={0})", id));
            }
        }
    }
}
