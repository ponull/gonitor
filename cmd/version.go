package cmd

import (
	"fmt"
	"github.com/spf13/cobra"
	"gonitor/core"
)

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "显示版本信息",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("Gonitor %s\n", core.Component)
		fmt.Printf("  Version:    %s\n", core.Version)
		fmt.Printf("  Build Time: %s\n", core.BuildTime)
		fmt.Printf("  Git Commit: %s\n", core.GitCommit)
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}
