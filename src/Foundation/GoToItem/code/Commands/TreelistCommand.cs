﻿using Sitecore.Shell.Framework.Commands;
using Sitecore.Web.UI.Sheer;
using System;
using Sitecore;
using System.Text;
using System.Web.UI;
using Sitecore.Diagnostics;
using Sitecore.Web.UI.HtmlControls;

namespace DollarName.Foundation.GoToItem.Commands
{
    [Serializable]
    public class TreeListCommand : Command
    {
        public override void Execute(CommandContext context)
        {
            Assert.ArgumentNotNull(context, nameof(context));

            string fieldId = context.Parameters["id"] ?? "";
            string id = "";

            //this is specific to Treelist. The selected item will have the _Selected suffix after its ID
            var control = Sitecore.Context.ClientPage.FindControl(fieldId + "_Selected");

            if (control != null && control is Listbox)
            {
                Listbox listBox = (Listbox)control;

                if (listBox?.Selected != null && listBox.Selected.Length > 0)
                {
                    //the listbox stores pipe delimited values, the value to the right of the pipe is the ID of the target item
                    var ids = listBox.Selected[0].Value.Split('|');

                    if (ids != null && ids.Length > 0)
                    {
                        //id[0] stores the <option> id which we don't need
                        id = ids[1];
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
