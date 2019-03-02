using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using System;
using Sitecore;
using Sitecore.Data.Items;
using System.Linq;
using Sitecore.Data;

namespace DollarName.Foundation.GoToItem.Fields
{
    [Serializable]
    public class GoToItemCommand : Command
    {
        public override void Execute(CommandContext context)
        {
            ClientPipelineArgs args = new ClientPipelineArgs();
            string fieldId = context.Parameters["id"];
            //droplink and droptree and grouped droplink
            //args.Parameters["id"] = Sitecore.Context.ClientPage.ClientRequest.Form[fieldId];
            //treelist
            //args.Parameters["id"] = ((Sitecore.Web.UI.HtmlControls.Listbox)Sitecore.Context.ClientPage.FindControl(fieldId + "_Selected")).Selected[0].Value.Split('|')[1];
            //multilist multilist with search
            //US THE SAME AS DROPLINK BUT ADD _SELECTED
            args.Parameters["id"] = Sitecore.Context.ClientPage.ClientRequest.Form[fieldId + "_Selected"];
            //args.Parameters["id"] = ((Sitecore.Shell.Applications.ContentEditor.MultilistEx)Sitecore.Context.ClientPage.FindControl(fieldId)).Value;


            //droplist
            //var onFocus = ((Sitecore.Shell.Applications.ContentEditor.ValueLookupEx)Sitecore.Context.ClientPage.FindControl(fieldId)).Attributes["onfocus"];
            //var idOfTargetField = onFocus.Substring(onFocus.IndexOf("fld=") + 4, 38);
            //var db = Sitecore.Configuration.Factory.GetDatabase("master");
            //var parentItemId = db.GetItem(idOfTargetField)[Sitecore.TemplateFieldIDs.Source];
            //var parentItem = db.GetItem(parentItemId);
            //args.Parameters["id"] = db.GetItem(parentItem.Paths.FullPath + "/" + Sitecore.Context.ClientPage.ClientRequest.Form[fieldId]).ID.ToString();

            //grouped droplist
            //var selectedChild = Sitecore.Context.ClientPage.ClientRequest.Form[fieldId];
            //var onFocus = ((Sitecore.Shell.Applications.ContentEditor.GroupedDroplist)Sitecore.Context.ClientPage.FindControl(fieldId)).Attributes["onfocus"];
            //var idOfTargetField = onFocus.Substring(onFocus.IndexOf("fld=") + 4, 38);
            //var db = Sitecore.Configuration.Factory.GetDatabase("master");
            //var grandParentItemId = db.GetItem(idOfTargetField)[Sitecore.TemplateFieldIDs.Source];
            //var grandParentItem = db.GetItem(grandParentItemId);
            //ID targetId = null;
            //foreach (Item parent in grandParentItem.Children)
            //{
            //    targetId = parent.Children.FirstOrDefault(x => x.Name == selectedChild)?.ID;
            //    if (targetId != (ID)null) break;
            //}
            //args.Parameters["id"] = targetId.ToString();
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
