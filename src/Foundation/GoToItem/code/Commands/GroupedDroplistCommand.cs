using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using System;
using Sitecore;
using Sitecore.Diagnostics;
using Sitecore.Data;
using Sitecore.Data.Items;
using System.Linq;

namespace DollarName.Foundation.GoToItem.Commands
{
    [Serializable]
    public class GroupedDropListCommand : Command
    {
        public override void Execute(CommandContext context)
        {
            Assert.ArgumentNotNull(context, nameof(context));

            string fieldId = context.Parameters["id"] ?? "";
            var selectedChild = Sitecore.Context.ClientPage.ClientRequest.Form[fieldId];
            string id = "";

            if (!string.IsNullOrEmpty(fieldId) && Sitecore.Context.ClientPage.FindControl(fieldId) != null)
            {
                var control = Sitecore.Context.ClientPage.FindControl(fieldId);

                //this block uses what's available to find out the ID of the item that was selected in the list type field
                if (control is Sitecore.Shell.Applications.ContentEditor.GroupedDroplist)
                {
                    //onfocus attribute stores the ID of the Template Field of the desired field
                    var onFocusValue = ((Sitecore.Shell.Applications.ContentEditor.GroupedDroplist)Sitecore.Context.ClientPage.FindControl(fieldId)).Attributes["onfocus"];

                    //parse the onfocus string to find the fld={guid}
                    int index = onFocusValue.IndexOf("fld=");

                    //bouncers; 4 is length of "fld="; 38 is length of the GUID with the braces and the hyphens
                    if (index > -1 && onFocusValue.Length > index + 4 + 38)
                    {
                        //extract the ID of the Template Field of the desired field
                        var idOfTemplateField = onFocusValue.Substring(index + 4, 38);

                        var db = Sitecore.Configuration.Factory.GetDatabase("master");

                        //get the target Template Field as an item to access its Source field later
                        var templateFieldItem = db?.GetItem(idOfTemplateField);

                        //get the value from the Source field. Now we know who the grandparent of the selected value on the item is
                        var grandParentItemId = templateFieldItem != null ? templateFieldItem[Sitecore.TemplateFieldIDs.Source] : "";
                        var grandParentItem = !string.IsNullOrEmpty(grandParentItemId) ? db?.GetItem(grandParentItemId) : null;

                        //loop thru grandchildren to find first match
                        ID targetId = null;
                        foreach (Item parent in grandParentItem.Children)
                        {
                            targetId = parent.Children.FirstOrDefault(x => x.Name == selectedChild)?.ID;
                            if (targetId != (ID)null)
                            {
                                //if there's a match, we don't keep looking
                                id = targetId.ToString();
                                break;
                            }
                        }
                    }
                }
            }

            ClientPipelineArgs args = new ClientPipelineArgs();
            args.Parameters["id"] = id;

            Context.ClientPage.Start(this, "Run", args);
        }

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
